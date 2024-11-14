#!/usr/bin/env node

import { Command } from 'commander';

import { createTextGeneration, setModel } from './util/ai';
import { isInGitRepo, hasGitChanges, getCurrentBranchName, getDiffForStagedFiles } from './util/git';
import CommitPolicy from './util/commit_policy';

const program = new Command();

program
	.option('-h --help', 'Display help for command')
	.parse(process.argv);

const options = program.opts();

async function main(): Promise<void> {
	if (options.help) {
		console.log(CommitPolicy);
		return;
	}

	if (!validateWorkingDirectory()) {
        return;
    }

	try {
		const branch = getCurrentBranchName();
		console.log(`Current branch: ${branch}`);
	} catch (error: any) {
		console.error(error.message);
	}

	const diff = getDiffForStagedFiles();

	const systemPrompt = CommitPolicy;
	const userPrompt = diff;

	const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
	if (commitMessage) {
		console.log(commitMessage);
	} else {
		console.error('Failed to generate commit message.');
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