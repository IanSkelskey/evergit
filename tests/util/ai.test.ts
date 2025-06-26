import { createTextGeneration, setModel, getModel, validateModelName, listModelNames, listModelsForProvider } from '../../src/util/ai';

// Mock `print` function from the prompt module and directly handle console.error and console.warn
jest.mock('../../src/util/prompt', () => ({
    print: (type: string, message: string) => {
        if (type === 'error') {
            // Suppress console.error output
            jest.fn();
        } else if (type === 'warn') {
            // Suppress console.warn output if necessary
            jest.fn();
        } else {
            console.log(message); // Allow console.log for non-error types
        }
    },
}));

describe('AI Utility Integration Tests', () => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    beforeAll(() => {
        if (!OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }
        setModel('gpt-4');
    });

    beforeEach(() => {
        process.env.OPENAI_API_KEY = OPENAI_API_KEY;
    });

    afterAll(() => {
        process.env.OPENAI_API_KEY = OPENAI_API_KEY;
    });

    test('should set model', async () => {
        const model = 'gpt-4';
        await setModel(model);
        expect(getModel()).toBe(model);
    });

    test('should validate model name', async () => {
        const validModel = 'gpt-4';
        const isValid = await validateModelName(validModel);
        expect(isValid).toBe(true);
    });

    test('should list model names', async () => {
        const modelNames = await listModelNames();
        expect(modelNames).toBeDefined();
        expect(modelNames).toContain('gpt-4');
    });

    test('should fail to set model with invalid model name', async () => {
        const invalidModel = 'invalid-model';

        try {
            await setModel(invalidModel);
        } catch (error) {
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
            const errorObj = error as Error;
            expect(errorObj.message).toContain('Model name');
            expect(errorObj.message).toContain(invalidModel);
        }
    });

    test('should fail to generate text from OpenAI API without API key', async () => {
        process.env.OPENAI_API_KEY = '';
        const systemPrompt = 'You are a helpful assistant.';
        const userPrompt = 'What is the capital of France?';

        const result = await createTextGeneration(systemPrompt, userPrompt);

        expect(result).toBeNull();
    });

    test('should generate text from OpenAI API', async () => {
        const systemPrompt = 'You are a helpful assistant.';
        const userPrompt = 'What is the capital of France?';

        const result = await createTextGeneration(systemPrompt, userPrompt);

        expect(result).toBeDefined();
        expect(result).toContain('Paris'); // Adjust the assertion based on the expected outcome
    });
});
