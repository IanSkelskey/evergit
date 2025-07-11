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

export function getGitRootDir(): string {
    try {
        return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch (error) {
        throw new Error('Unable to determine git repository root directory.');
    }
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
        const gitRoot = getGitRootDir();
        execSync(`git -C "${gitRoot}" push`);
    } catch (error: any) {
        if (error.message.includes('fatal: The current branch')) {
            throw new Error('The current branch has no upstream branch.');
        }
    }
}

export function setUserName(name: string): void {
    execSync(`git config user.name "${name}"`);
}

export function setUserEmail(email: string): void {
    execSync(`git config user.email "${email}"`);
}

export function setupUpstreamBranch(): void {
    const branchName = getCurrentBranchName();
    const gitRoot = getGitRootDir();
    execSync(`git -C "${gitRoot}" push --set-upstream origin ${branchName}`);
}

export function stageAllFiles(): void {
    const gitRoot = getGitRootDir();
    execSync(`git -C "${gitRoot}" add .`);
}

export function stageFile(filePath: string): void {
    const gitRoot = getGitRootDir();
    execSync(`git -C "${gitRoot}" add "${filePath}"`);
}

export function unstageFile(filePath: string): void {
    const gitRoot = getGitRootDir();
    execSync(`git -C "${gitRoot}" restore --staged "${filePath}"`);
}

export function unstageAllFiles(): void {
    const gitRoot = getGitRootDir();
    execSync(`git -C "${gitRoot}" restore --staged .`);
}

export function listChangedFiles(): string[] {
    const gitRoot = getGitRootDir();
    const statusOutput = execSync(`git -C "${gitRoot}" status --porcelain`).toString().trim();
    return statusOutput
        .split('\n')
        .map((line) => line.trim().slice(2).trim())
        .filter(Boolean);
}

export function getStatusForFile(filePath: string): GitFileStatus {
    const gitRoot = getGitRootDir();
    const status = execSync(`git -C "${gitRoot}" status --porcelain "${filePath}"`).toString().trim();
    if (!status) {
        return GitFileStatus['!'];
    }
    return status.charAt(0) as GitFileStatus;
}

export function getDiffForStagedFiles(): string {
    const maxBufferSize = 10 * 1024 * 1024; // 10 MB buffer
    try {
        const gitRoot = getGitRootDir();
        let diff: string = execSync(`git -C "${gitRoot}" diff --staged`, { maxBuffer: maxBufferSize }).toString();
        diff = removeDiffForFile(diff, 'package-lock.json');
        return diff;
    } catch (error: any) {
        if (error.code === 'ENOBUFS') {
            throw new Error(
                'Buffer overflow: The diff output exceeds the buffer limit. Consider reducing the number of staged files or increasing the buffer size.',
            );
        } else {
            throw error; // Re-throw other errors if they are not ENOBUFS
        }
    }
}

function removeDiffForFile(diff: string, filePath: string): string {
    const regex = new RegExp(`diff --git a/${filePath} b/${filePath}[\\s\\S]*?(?=diff --git|$)`, 'g');
    return diff.replace(regex, '');
}

export function getCurrentBranchName(): string {
    try {
        const gitRoot = getGitRootDir();

        // First try the standard approach
        try {
            const branchName = execSync(`git -C "${gitRoot}" rev-parse --abbrev-ref HEAD`, {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'], // Capture stderr
            }).trim();

            if (branchName === 'HEAD') {
                // We're in a detached HEAD state
                throw new Error('Repository is in detached HEAD state. Please checkout a branch.');
            }

            return branchName;
        } catch (error: any) {
            // If rev-parse fails, try symbolic-ref for new repos
            if (error.message?.includes('ambiguous argument') || error.message?.includes('unknown revision')) {
                try {
                    const branchName = execSync(`git -C "${gitRoot}" symbolic-ref --short HEAD`, {
                        encoding: 'utf-8',
                    }).trim();
                    return branchName;
                } catch {
                    // If symbolic-ref also fails, we might be in a completely new repo
                    // Try to get the default branch name from config
                    try {
                        const defaultBranch = execSync(`git -C "${gitRoot}" config init.defaultBranch`, {
                            encoding: 'utf-8',
                        }).trim();
                        return defaultBranch || 'main'; // Default to 'main' if not configured
                    } catch {
                        return 'main'; // Final fallback
                    }
                }
            }
            throw error;
        }
    } catch (error) {
        throw new Error('Unable to get current branch name.');
    }
}

export function hasGitChanges(): boolean {
    const gitRoot = getGitRootDir();
    const status = execSync(`git -C "${gitRoot}" status --porcelain`).toString().trim();
    return status.length > 0;
}

export function getName(): string {
    try {
        return execSync('git config user.name', { encoding: 'utf-8' }).trim();
    } catch {
        return '';
    }
}

export function getEmail(): string {
    try {
        return execSync('git config user.email', { encoding: 'utf-8' }).trim();
    } catch {
        return '';
    }
}

export function commitWithMessage(message: string): void {
    const gitRoot = getGitRootDir();
    const sanitizedMessage = sanitizeCommitMessage(message);
    const tempFilePath = path.join(os.tmpdir(), 'commit-message.txt');

    fs.writeFileSync(tempFilePath, sanitizedMessage);
    execSync(`git -C "${gitRoot}" commit -F "${tempFilePath}"`);
    fs.unlinkSync(tempFilePath); // Clean up the temporary file
}

function sanitizeCommitMessage(message: string): string {
    // First escape backslashes, then escape double quotes
    return message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function checkForRemote(remoteUrl: string): boolean {
    const gitRoot = getGitRootDir();
    const remoteUrls = execSync(`git -C "${gitRoot}" remote -v`).toString();
    return remoteUrls.includes(remoteUrl);
}

export function getRemoteName(remoteUrl: string): string {
    const gitRoot = getGitRootDir();
    const remoteUrls = execSync(`git -C "${gitRoot}" remote -v`).toString();
    const remoteName = remoteUrls.split('\n').find((line: string) => line.includes(remoteUrl));
    return remoteName ? remoteName.split('\t')[0] : '';
}
