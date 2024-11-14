import { createTextGeneration } from '../util/ai';
import { isInGitRepo, hasGitChanges, getCurrentBranchName, getDiffForStagedFiles, getName, getEmail, listChangedFiles, stageFile, commitWithMessage } from '../util/git';
import CommitPolicy from '../util/commit_policy';
import { selectFilesToStage, confirmCommitMessage, print } from '../util/prompt';
import inquirer from 'inquirer';

async function commit(): Promise<void> {
  if (!validateWorkingDirectory()) {
    return;
  }

  const changedFiles = listChangedFiles();
  const filesToStage = await selectFilesToStage(changedFiles);
  filesToStage.forEach(stageFile);

  const branch = getCurrentBranchName();
  console.log(`Current branch: ${branch}`);

  const userDiff = getDiffForStagedFiles();
  const userName = getName();
  const userEmail = getEmail();

  const bugNumberAnswer = await inquirer.prompt({
    type: 'input',
    name: 'bugNumber',
    message: 'Enter the Launchpad bug number (if applicable):',
  });
  const bugNumber = bugNumberAnswer.bugNumber;

  const systemPrompt = CommitPolicy;
  const userPrompt = `
    Diff:
    ${userDiff}

    User Information:
    Name: ${userName}
    Email: ${userEmail}

    Launchpad Bug Number: ${bugNumber}
  `;

  const commitMessage = await createTextGeneration(systemPrompt, userPrompt);
  if (commitMessage) {
    print('info', 'Generated Commit Message:');
    print('content', commitMessage);

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

export default commit;