import { createTextGeneration, setModel } from '../util/ai';
import {
    isInGitRepo,
    hasGitChanges,
    getCurrentBranchName,
    getDiffForStagedFiles,
    getName,
    getEmail,
    listChangedFiles,
    stageFile,
    commitWithMessage,
} from '../util/git';
import COMMIT_POLICY from '../util/commit_policy';
import { selectFilesToStage, confirmCommitMessage, print, requestLaunchpadBugNumber } from '../util/prompt';
import { authenticateLaunchpad, loadCredentials, getBugInfo, BugMessage } from '../util/launchpad';

async function commit(model: string): Promise<void> {
    if (model) {
        setModel(model);
    }

    if (!validateWorkingDirectory()) {
        return;
    }

    const filesToStage = await getStagedFiles();
    filesToStage.forEach(stageFile);

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
    const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
    if (commitMessage) {
        await processCommitMessage(commitMessage);
    } else {
        print('error', 'Failed to generate commit message.');
    }
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
    return {
        name: getName(),
        email: getEmail(),
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

// Helper function to process and confirm the commit message with the user
async function processCommitMessage(commitMessage: string): Promise<void> {
    const confirmed = await confirmCommitMessage(commitMessage);
    if (confirmed) {
        commitWithMessage(commitMessage);
        print('success', 'Commit successful.');
    } else {
        print('warning', 'Commit aborted.');
    }
}

export default commit;
