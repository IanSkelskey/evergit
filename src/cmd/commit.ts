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
import CommitPolicy from '../util/commit_policy';
import { selectFilesToStage, confirmCommitMessage, print } from '../util/prompt';
import inquirer from 'inquirer';

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

    const systemPrompt = CommitPolicy;
    const userPrompt = buildUserPrompt(userInfo, bugNumber);

    const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
    if (commitMessage) {
        await processCommitMessage(commitMessage);
    } else {
        print('error', 'Failed to generate commit message.');
    }
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
function buildUserPrompt(userInfo: { name: string; email: string; diff: string }, bugNumber: string): string {
    return `
    Diff:
    ${userInfo.diff}

    User Information:
    Name: ${userInfo.name}
    Email: ${userInfo.email}

    Launchpad Bug Number: ${bugNumber}
  `;
}

// Helper function to process and confirm the commit message with the user
async function processCommitMessage(commitMessage: string): Promise<void> {
    print('info', 'Generated Commit Message:');
    print('content', commitMessage);

    const confirmed = await confirmCommitMessage(commitMessage);
    if (confirmed) {
        commitWithMessage(commitMessage);
        print('success', 'Commit successful.');
    } else {
        print('warning', 'Commit aborted.');
    }
}

export default commit;
