import { main } from '../src/main';
import commit from '../src/cmd/commit';

jest.mock('../src/cmd/commit', () => jest.fn());

// Mock `process.exit` to prevent Jest from exiting during tests
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit called with code ${code}`);
});

describe('Main CLI', () => {
    const originalArgv = process.argv;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        process.argv = originalArgv;
        mockExit.mockRestore();
    });

    test('should call commit command with default options', async () => {
        process.argv = ['node', 'main.js', 'commit'];
        await main();

        expect(commit).toHaveBeenCalledWith('gpt-4o', undefined); // Default model, no `--all`
    });

    test('should call commit command with custom model and --all option', async () => {
        process.argv = ['node', 'main.js', 'commit', '-m', 'gpt-3.5', '--all'];
        await main();

        expect(commit).toHaveBeenCalledWith('gpt-3.5', true);
    });

    test('should show help when no arguments are passed', async () => {
        // Mock `program.outputHelp` directly
        const outputHelpSpy = jest.spyOn(require('commander').Command.prototype, 'outputHelp').mockImplementation(() => {});

        process.argv = ['node', 'main.js'];
        try {
            await main();
        } catch (e) {
            expect((e as Error).message).toContain('process.exit called'); // Ensure process.exit was called
        }

        expect(outputHelpSpy).toHaveBeenCalled();
        outputHelpSpy.mockRestore();
    });
});
