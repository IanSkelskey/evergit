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
import { selectFilesToStage, confirmCommitMessage, print } from '../util/prompt';
import inquirer from 'inquirer';
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
    const bugNumber = await promptForBugNumber();

    const credentials = await getLaunchPadCredentials();
    if (!credentials) {
        print('error', 'Failed to authenticate with Launchpad.');
        return;
    }
    const bug = await getBugInfo(bugNumber, credentials.accessToken, credentials.accessTokenSecret);
    const bugMessages = await bug.getMessages();

    const systemPrompt = COMMIT_POLICY;
    const userPrompt = buildUserPrompt(userInfo, bugNumber, bugMessages);

    const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
    if (commitMessage) {
        await processCommitMessage(commitMessage);
    } else {
        print('error', 'Failed to generate commit message.');
    }
}

// Helper function to authenticate with Launchpad
async function getLaunchPadCredentials(): Promise<{ accessToken: string; accessTokenSecret: string } | null> {
    authenticateLaunchpad('evergit');
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

// Helper function to prompt for a Launchpad bug number
async function promptForBugNumber(): Promise<string> {
    const answer = await inquirer.prompt({
        type: 'input',
        name: 'bugNumber',
        message: 'Enter the Launchpad bug number (if applicable):',
    });
    return answer.bugNumber;
}

// Helper function to build the user prompt string for text generation
function buildUserPrompt(
    userInfo: { name: string; email: string; diff: string },
    bugNumber: string,
    bugMessages: BugMessage[],
): string {
    const messages = bugMessages.map((message) => message.toString()).join('\n');
    return `${userInfo.name} <${userInfo.email}>\n\n${userInfo.diff}\n\n${messages}`;
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
