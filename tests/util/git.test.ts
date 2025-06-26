import {
    getCurrentBranchName,
    getStatusForFile,
    hasGitChanges,
    isInGitRepo,
    stageAllFiles,
    commitWithMessage,
    setUserEmail,
    setUserName,
    getGitRootDir,
} from '../../src/util/git';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Git Utilities Integration Tests', () => {
    const testFilePath = 'test-file.txt';
    let testRepoDir: string;
    const remoteName = 'origin';
    const remoteUrl = 'https://example.com/fake.git';

    beforeAll(() => {
        // Create a temporary directory for the test repository
        testRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-repo-'));
        process.chdir(testRepoDir);

        // Ensure a Git repository is initialized and an initial commit is made
        try {
            execSync('git init');
            execSync(`git remote add ${remoteName} ${remoteUrl}`);
            setUserName('Test User');
            setUserEmail('test@example.com');
            fs.writeFileSync(testFilePath, 'Initial content');
            stageAllFiles();
            commitWithMessage('Initial commit');
        } catch (error) {
            console.error('Failed to initialize Git repository for tests.');
        }
    });

    afterAll(() => {
        // Clean up by removing the test repository
        process.chdir('..'); // Move out of the test repository directory
        fs.rmSync(testRepoDir, { recursive: true, force: true });
    });

    describe('isInGitRepo', () => {
        test('should return true if inside a Git repository', () => {
            expect(isInGitRepo()).toBe(true);
        });
    });

    describe('getGitRootDir', () => {
        test('should return the root directory of the Git repository', () => {
            const rootDir = getGitRootDir();
            // Normalize paths to use forward slashes for comparison
            const normalizedRootDir = rootDir.replace(/\\/g, '/');
            const normalizedTestRepoDir = testRepoDir.replace(/\\/g, '/');
            expect(normalizedRootDir).toBe(normalizedTestRepoDir);
        });
    });

    describe('addAllChanges and hasGitChanges', () => {
        test('should detect changes after adding a file', () => {
            fs.writeFileSync(testFilePath, 'Test content');
            expect(hasGitChanges()).toBe(true);
        });
    });

    describe('getCurrentBranchName', () => {
        test('should return the current branch name', () => {
            const branchName = getCurrentBranchName();
            expect(branchName === 'master' || branchName === 'main').toBe(true);
        });

        test('should handle new repository with no commits', () => {
            // Create a new test directory for this specific test
            const newRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'new-repo-'));
            const originalCwd = process.cwd();

            try {
                process.chdir(newRepoDir);
                execSync('git init');

                // Should still be able to get branch name even with no commits
                const branchName = getCurrentBranchName();
                expect(branchName === 'master' || branchName === 'main').toBe(true);
            } finally {
                process.chdir(originalCwd);
                fs.rmSync(newRepoDir, { recursive: true, force: true });
            }
        });
    });

    describe('getStatusForFile', () => {
        test('should return the status for a specific file', () => {
            // Step 1: Modify the file after the initial commit and check the status
            fs.writeFileSync(testFilePath, 'Modified content');
            stageAllFiles();
            expect(getStatusForFile(testFilePath)).toBe('M');
        });
        test('should return ignored for a .gitignored file', () => {
            const ignoredFile = 'ignored.txt';
            fs.writeFileSync('.gitignore', 'ignored.txt\n');
            fs.writeFileSync(ignoredFile, 'ignore me');
            stageAllFiles();
            commitWithMessage('Add .gitignore and ignored.txt');
            expect(getStatusForFile(ignoredFile)).toBe('Ignored');
        });
        test('should return untracked for a new file', () => {
            const untrackedFile = 'untracked.txt';
            fs.writeFileSync(untrackedFile, 'new file');
            expect(getStatusForFile(untrackedFile)).toBe('?');
        });
    });

    describe('stageFile, unstageFile, unstageAllFiles', () => {
        test('should stage and unstage a file', () => {
            const file = 'stage-me.txt';
            fs.writeFileSync(file, 'stage this');
            require('../../src/util/git').stageFile(file);
            expect(getStatusForFile(file)).toBe('A');
            require('../../src/util/git').unstageFile(file);
            // After unstaging, should be untracked
            expect(getStatusForFile(file)).toBe('?');
        });
        test('should unstage all files', () => {
            const file = 'unstage-all.txt';
            fs.writeFileSync(file, 'unstage all');
            require('../../src/util/git').stageFile(file);
            require('../../src/util/git').unstageAllFiles();
            expect(getStatusForFile(file)).toBe('?');
        });
    });

    describe('listChangedFiles', () => {
        test('should list changed files', () => {
            const file = 'changed.txt';
            fs.writeFileSync(file, 'changed');
            require('../../src/util/git').stageFile(file);
            const changed = require('../../src/util/git').listChangedFiles();
            expect(changed.map((f: string) => f.trim())).toContain(file);
        });
    });

    describe('getName and getEmail', () => {
        test('should get the configured user name and email', () => {
            const { getName, getEmail } = require('../../src/util/git');
            expect(getName()).toBe('Test User');
            expect(getEmail()).toBe('test@example.com');
        });

        test('should return empty string when name is not configured', () => {
            const { getName } = require('../../src/util/git');
            const childProcess = require('child_process');
            const originalExecSync = childProcess.execSync;
            childProcess.execSync = jest.fn((cmd: string, options?: any) => {
                if (typeof cmd === 'string' && cmd === 'git config user.name') {
                    throw new Error('No user.name set');
                }
                return originalExecSync(cmd, options);
            });
            try {
                expect(getName()).toBe('');
            } finally {
                childProcess.execSync = originalExecSync;
            }
        });

        test('should return empty string when email is not configured', () => {
            const { getEmail } = require('../../src/util/git');
            const childProcess = require('child_process');
            const originalExecSync = childProcess.execSync;
            childProcess.execSync = jest.fn((cmd: string, options?: any) => {
                if (typeof cmd === 'string' && cmd === 'git config user.email') {
                    throw new Error('No user.email set');
                }
                return originalExecSync(cmd, options);
            });
            try {
                expect(getEmail()).toBe('');
            } finally {
                childProcess.execSync = originalExecSync;
            }
        });
    });

    describe('commitWithMessage', () => {
        test('should commit with special characters in the message', () => {
            fs.writeFileSync('special.txt', 'special');
            require('../../src/util/git').stageFile('special.txt');
            expect(() => commitWithMessage('A commit with "quotes" and special chars !@#$%^&*()')).not.toThrow();
        });
    });

    describe('checkForRemote and getRemoteName', () => {
        test('should detect the remote and get its name', () => {
            const { checkForRemote, getRemoteName } = require('../../src/util/git');
            expect(checkForRemote(remoteUrl)).toBe(true);
            expect(getRemoteName(remoteUrl)).toBe(remoteName);
        });
    });

    describe('getDiffForStagedFiles', () => {
        test('should return a diff for staged files', () => {
            const file = 'diffme.txt';
            fs.writeFileSync(file, 'diff this');
            require('../../src/util/git').stageFile(file);
            const diff = require('../../src/util/git').getDiffForStagedFiles();
            expect(diff).toContain('diff --git');
        });
        test('should throw on ENOBUFS error', () => {
            // Mock execSync to throw ENOBUFS only for diff command
            const git = require('../../src/util/git');
            const childProcess = require('child_process');
            const originalExecSync = childProcess.execSync;
            childProcess.execSync = jest.fn((cmd: string, options?: any) => {
                if (typeof cmd === 'string' && cmd.includes('diff --staged')) {
                    const err = new Error('ENOBUFS');
                    (err as any).code = 'ENOBUFS';
                    throw err;
                }
                return originalExecSync(cmd, options);
            });
            try {
                expect(() => git.getDiffForStagedFiles()).toThrow('Buffer overflow');
            } finally {
                childProcess.execSync = originalExecSync;
            }
        });
    });

    describe('pushChanges and setupUpstreamBranch', () => {
        test('should throw if no upstream branch', () => {
            const git = require('../../src/util/git');
            // Create a new branch with no upstream
            execSync('git checkout -b test-branch');
            expect(() => git.pushChanges()).toThrow('The current branch has no upstream branch.');
        });
        test('should not throw when setting up upstream branch', () => {
            const git = require('../../src/util/git');
            const childProcess = require('child_process');
            const originalExecSync = childProcess.execSync;
            execSync('git checkout -b upstream-branch');
            // Mock execSync to prevent actual push only
            childProcess.execSync = jest.fn((cmd: string, options?: any) => {
                if (typeof cmd === 'string' && cmd.includes('push --set-upstream')) {
                    return '';
                }
                return originalExecSync(cmd, options);
            });
            try {
                expect(() => git.setupUpstreamBranch()).not.toThrow();
            } finally {
                childProcess.execSync = originalExecSync;
            }
        });
    });
});
