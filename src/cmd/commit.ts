import { createTextGeneration, setModel, initializeFromConfig, setProvider, getProviderName } from '../util/ai';
import {
    isInGitRepo,
    hasGitChanges,
    getCurrentBranchName,
    getDiffForStagedFiles,
    getName as getGitName,
    getEmail as getGitEmail,
    listChangedFiles,
    stageFile,
    commitWithMessage,
    unstageAllFiles,
    stageAllFiles,
} from '../util/git';
import { getConfig } from './config';
import COMMIT_POLICY from '../util/commit_policy';
import {
    selectFilesToStage,
    confirmCommitMessage,
    print,
    requestLaunchpadBugNumber,
    requestFeedback,
} from '../util/prompt';
import { authenticateLaunchpad, loadCredentials, getBugInfo, BugMessage } from '../util/launchpad';
import ora from 'ora';

async function commit(model: string | undefined, addAllChanges: boolean = false, provider?: string): Promise<void> {
    // Initialize from config first
    initializeFromConfig();

    // Override provider if specified
    if (provider) {
        if (provider !== 'openai' && provider !== 'openwebui') {
            print('error', 'Invalid provider. Must be "openai" or "openwebui".');
            return;
        }
        setProvider(provider as 'openai' | 'openwebui');
    }

    // Validate API key for the selected provider
    const currentProvider = getProviderName();
    if (currentProvider === 'openai' && !process.env.OPENAI_API_KEY) {
        print('error', 'OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
        return;
    }

    if (model) {
        try {
            await setModel(model);
        } catch (error) {
            print('error', (error as Error).message);
            return;
        }
    }

    if (!validateWorkingDirectory()) {
        return;
    }

    if (addAllChanges) {
        stageAllFiles();
    } else {
        const filesToStage = await getStagedFiles();
        filesToStage.forEach((file) => stageFile(file.trim()));
    }

    const branch = getCurrentBranchName();
    print('info', `Committing changes to branch ${branch}`);

    const userInfo = getUserInfo();
    const bugNumber = await requestLaunchpadBugNumber();

    if (bugNumber !== '') {
        await commitWithBugInfo(userInfo, bugNumber);
    } else {
        commitWithoutBugInfo(userInfo);
    }
}

async function generateAndProcessCommit(systemPrompt: string, userPrompt: string): Promise<void> {
    const spinner = ora('Generating commit message...').start();
    const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
    spinner.stop();

    if (!commitMessage) {
        print('error', 'Failed to generate commit message.');
        return;
    }

    let confirmed = await confirmCommitMessage(commitMessage);
    while (!confirmed) {
        const feedback = await requestFeedback();
        if (feedback === '') {
            unstageAllFiles();
            print('warning', 'Commit aborted. Staged files have been unstaged.');
            return;
        }

        const newUserPrompt: string = `${userPrompt}\n\nCommit message draft:\n\n${commitMessage}\n\nFeedback:\n${feedback}`;
        spinner.text = 'Regenerating commit message with feedback...';
        spinner.start();
        const newMessage: string | null = await createTextGeneration(systemPrompt, newUserPrompt);
        spinner.stop();

        if (!newMessage) {
            print('error', 'Failed to generate new commit message.');
            return;
        }

        // Update the commit message with the new version
        confirmed = await confirmCommitMessage(newMessage);
        if (confirmed) {
            // Use the confirmed message for the commit
            commitWithMessage(newMessage);
            print('success', 'Changes committed successfully.');
            return;
        }
    }

    // If we got here, the original message was confirmed
    commitWithMessage(commitMessage);
    print('success', 'Changes committed successfully.');
}

async function commitWithoutBugInfo(userInfo: { name: string; email: string; diff: string }): Promise<void> {
    const systemPrompt = COMMIT_POLICY;
    const userPrompt = buildUserPrompt(userInfo);
    generateAndProcessCommit(systemPrompt, userPrompt);
}

async function commitWithBugInfo(
    userInfo: { name: string; email: string; diff: string },
    bugNumber: string,
): Promise<void> {
    const credentials = await getLaunchPadCredentials();
    if (!credentials) {
        print('error', 'Failed to authenticate with Launchpad.');
        return;
    }
    const bug = await getBugInfo(bugNumber, credentials.accessToken, credentials.accessTokenSecret);
    const bugMessages = await bug.getMessages();

    const systemPrompt = COMMIT_POLICY;
    const userPrompt = buildUserPrompt(userInfo, bugNumber, bugMessages);
    generateAndProcessCommit(systemPrompt, userPrompt);
}

// Helper function to authenticate with Launchpad
async function getLaunchPadCredentials(): Promise<{ accessToken: string; accessTokenSecret: string } | null> {
    await authenticateLaunchpad('evergit');
    return loadCredentials();
}

// Helper function to validate if the current directory is a Git repository with changes
function validateWorkingDirectory(): boolean {
    if (!isInGitRepo() || !hasGitChanges()) {
        print('error', !isInGitRepo() ? 'Not in a git repository.' : 'No changes detected.');
        return false;
    }
    return true;
}

// Helper function to prompt the user to select files to stage
async function getStagedFiles(): Promise<string[]> {
    const changedFiles = listChangedFiles();
    return await selectFilesToStage(changedFiles);
}

// Helper function to retrieve the user's name and email from Git
function getUserInfo(): { name: string; email: string; diff: string } {
    const name = getConfig('name') || getGitName();
    const email = getConfig('email') || getGitEmail();

    if (!name || !email) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');

        print('error', `Git user ${missingFields.join(' and ')} not configured.`);
        print('info', 'Please configure git or evergit:');
        if (!name) {
            print('info', '  git config --global user.name "Your Name"');
            print('info', '  OR');
            print('info', '  evergit config set name "Your Name"');
        }
        if (!email) {
            print('info', '  git config --global user.email "your.email@example.com"');
            print('info', '  OR');
            print('info', '  evergit config set email "your.email@example.com"');
        }
        throw new Error('Missing git configuration');
    }

    return {
        name,
        email,
        diff: getDiffForStagedFiles(),
    };
}

// Helper function to build the user prompt string for text generation
function buildUserPrompt(
    userInfo: { name: string; email: string; diff: string },
    bugNumber: string = '',
    bugMessages: BugMessage[] = [],
): string {
    const messages = bugMessages.map((message) => message.toString()).join('\n');
    return bugNumber !== ''
        ? `User: ${userInfo.name} <${userInfo.email}>\n\nBug: ${bugNumber}\n\n${messages}\n\n${userInfo.diff}`
        : `User: ${userInfo.name} <${userInfo.email}>\n\n${userInfo.diff}`;
}

export default commit;
