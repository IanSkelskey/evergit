import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export enum GitFileStatus {
    'A' = 'Added',
    'M' = 'Modified',
    'D' = 'Deleted',
    'R' = 'Renamed',
    'C' = 'Copied',
    'U' = 'Unmerged',
    '?' = 'Untracked',
    '!' = 'Ignored',
}

export function isInGitRepo(): boolean {
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export function pushChanges(): void {
    try {
        execSync('git push');
    } catch (error: any) {
        if (error.message.includes('fatal: The current branch')) {
            throw new Error('The current branch has no upstream branch.');
        }
    }
}

export function setupUpstreamBranch(): void {
    const branchName = getCurrentBranchName();
    execSync(`git push --set-upstream origin ${branchName}`);
}

export function addAllChanges(): void {
    execSync('git add .');
}

export function stageFile(filePath: string): void {
    execSync(`git add ${filePath}`);
}

export function unstageFile(filePath: string): void {
    execSync(`git restore --staged ${filePath}`);
}

export function unstageAllFiles(): void {
    execSync('git restore --staged .');
}

export function listChangedFiles(): string[] {
    const statusOutput = execSync('git status --porcelain').toString().trim();
    return statusOutput
        .split('\n')
        .map((line) => line.trim().slice(2))
        .filter(Boolean);
}

export function getStatusForFile(filePath: string): GitFileStatus {
    const status = execSync(`git status --porcelain "${filePath}"`).toString().trim();
    if (!status) {
        return GitFileStatus['!'];
    }
    return status.charAt(0) as GitFileStatus;
}

export function getDiffForAll(): string {
    return execSync('git diff').toString();
}

export function getDiffForStagedFiles(): string {
    var diff: string = execSync('git diff --staged').toString();
    // if the file is package-lock.json, remove that file from the diff
    if (diff.includes('diff --git a/package-lock.json b/package-lock.json')) {
        const regex = /diff --git a\/package-lock.json b\/package-lock.json[\s\S]*?(?=diff --git|$)/g;
        diff = diff.replace(regex, '');
    }
    return diff;
}


export function getCurrentBranchName(): string {
    try {
        const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf-8',
        }).trim();
        
        return branchName;
    } catch (error) {
        throw new Error('Unable to get current branch name.');
    }
}

export function hasGitChanges(): boolean {
    const status = execSync('git status --porcelain').toString().trim();
    return status.length > 0;
}

export function getName(): string {
    return execSync('git config user.name').toString().trim();
}

export function getEmail(): string {
    return execSync('git config user.email').toString().trim();
}

export function commitWithMessage(message: string): void {
    const sanitizedMessage = sanitizeCommitMessage(message);
    const tempFilePath = path.join(os.tmpdir(), 'commit-message.txt');
    
    fs.writeFileSync(tempFilePath, sanitizedMessage);
    execSync(`git commit -F "${tempFilePath}"`);
    fs.unlinkSync(tempFilePath); // Clean up the temporary file
}

export function sanitizeCommitMessage(message: string): string {
    return message.replace(/"/g, '\\"');
}

export function checkForRemote(remoteUrl: string): boolean {
    const remoteUrls = execSync('git remote -v').toString();
    return remoteUrls.includes(remoteUrl);
}

export function getRemoteName(remoteUrl: string): string {
    const remoteUrls = execSync('git remote -v').toString();
    const remoteName = remoteUrls.split('\n').find((line: string) => line.includes(remoteUrl));
    return remoteName ? remoteName.split('\t')[0] : '';
}
