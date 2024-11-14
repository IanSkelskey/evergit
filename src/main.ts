#!/usr/bin/env node

import { Command } from 'commander';
import { createTextGeneration } from './util/ai';
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
} from './util/git';
import CommitPolicy from './util/commit_policy';
import { selectFilesToStage, confirmCommitMessage, print, showHelpMenu, requestLaunchpadBugNumber } from './util/prompt';

const program = new Command();

program
    .option('-m, --model <model>', 'Specify model for message generation', 'default')
    .option('-h --help', 'Display help for command')
    .parse(process.argv);

const options = program.opts();

async function main(): Promise<void> {
    if (options.help) {
        showHelpMenu();
        return;
    }

    if (!validateWorkingDirectory()) {
        return;
    }

    // Select files to stage
    const changedFiles = listChangedFiles();
    const filesToStage = await selectFilesToStage(changedFiles);
    filesToStage.forEach(stageFile);

    const branch = getCurrentBranchName();
    console.log(`Current branch: ${branch}`);

    const userDiff = getDiffForStagedFiles();
    const userName = getName();
    const userEmail = getEmail();
	const bugNumber = await requestLaunchpadBugNumber();

    // Construct user prompt with diff and user information
    const systemPrompt = CommitPolicy;
    const userPrompt = `
    Diff:
    ${userDiff}

    User Information:
    Name: ${userName}
    Email: ${userEmail}

	Lanchpad Bug Number: ${bugNumber}
  `;

    // Generate commit message
    const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
    if (commitMessage) {
        // Confirm and commit
        const confirmed = await confirmCommitMessage(commitMessage);
        if (confirmed) {
            commitWithMessage(commitMessage);
            print('success', 'Commit successful.');
        } else {
            print('warning', 'Commit aborted.');
        }
    } else {
        print('error', 'Failed to generate commit message.');
    }
}

function validateWorkingDirectory(): boolean {
    if (!isInGitRepo() || !hasGitChanges()) {
        console.error(!isInGitRepo() ? 'Not in a git repository.' : 'No changes detected.');
        return false;
    }
    return true;
}

main().catch((err) => {
    console.error('An error occurred:', err);
});
