import {
    getCurrentBranchName,
    getStatusForFile,
    hasGitChanges,
    isInGitRepo,
    stageAllFiles,
    commitWithMessage,
} from '../../src/util/git';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Git Utilities Integration Tests', () => {
    const testFilePath = 'test-file.txt';
    let testRepoDir: string;

    beforeAll(() => {
        // Create a temporary directory for the test repository
        testRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-repo-'));
        process.chdir(testRepoDir);

        // Ensure a Git repository is initialized and an initial commit is made
        try {
            execSync('git init');
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
    });

    describe('getStatusForFile', () => {
        test('should return the status for a specific file', () => {
            // Step 1: Modify the file after the initial commit and check the status
            fs.writeFileSync(testFilePath, 'Modified content');
            stageAllFiles();
            expect(getStatusForFile(testFilePath)).toBe('M');
        });
    });
});
