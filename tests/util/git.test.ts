import {
    GitFileStatus,
    stageAllFiles,
    getCurrentBranchName,
    getStatusForFile,
    hasGitChanges,
    isInGitRepo,
} from '../../src/util/git';
import { execSync } from 'child_process';

jest.mock('child_process', () => ({
    execSync: jest.fn(),
}));

describe('Git Utilities', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('isInGitRepo', () => {
        test('should return true if inside a Git repository', () => {
            (execSync as jest.Mock).mockReturnValueOnce('true');
            expect(isInGitRepo()).toBe(true);
        });

        test('should return false if not inside a Git repository', () => {
            (execSync as jest.Mock).mockImplementationOnce(() => {
                throw new Error();
            });
            expect(isInGitRepo()).toBe(false);
        });
    });

    describe('getCurrentBranchName', () => {
        test('should return the current branch name', () => {
            (execSync as jest.Mock).mockReturnValueOnce('main\n');
            expect(getCurrentBranchName()).toBe('main');
        });

        test('should throw an error if branch name cannot be retrieved', () => {
            (execSync as jest.Mock).mockImplementationOnce(() => {
                throw new Error();
            });
            expect(() => getCurrentBranchName()).toThrow('Unable to get current branch name.');
        });
    });

    describe('hasGitChanges', () => {
        test('should return true if there are changes in the Git working tree', () => {
            (execSync as jest.Mock).mockReturnValueOnce('M src/util/git.ts\n');
            expect(hasGitChanges()).toBe(true);
        });

        test('should return false if there are no changes in the Git working tree', () => {
            (execSync as jest.Mock).mockReturnValueOnce('');
            expect(hasGitChanges()).toBe(false);
        });
    });

    describe('addAllChanges', () => {
        test('should stage all changes', () => {
            stageAllFiles();
            expect(execSync).toHaveBeenCalledWith('git add .');
        });
    });

    describe('getStatusForFile', () => {
        test('should return the status for a specific file', () => {
            (execSync as jest.Mock).mockReturnValueOnce('M src/util/git.ts\n');
            expect(getStatusForFile('src/util/git.ts')).toBe('M');
        });

        test('should return Ignored status if the file is not tracked', () => {
            (execSync as jest.Mock).mockReturnValueOnce('');
            expect(getStatusForFile('src/util/git.ts')).toBe(GitFileStatus['!']);
        });
    });
});
