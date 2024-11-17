import { createTextGeneration, setModel, getModel, validateModelName, listModelNames } from '../../src/util/ai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

describe('AI Utility Integration Tests', () => {
	beforeAll(() => {
		// Ensure API key is present for the test to run
		if (!OPENAI_API_KEY) {
			throw new Error("OPENAI_API_KEY is not set in environment variables.");
		}
		setModel('gpt-4'); // or set your desired model version
	});

	beforeEach(() => {
		process.env.OPENAI_API_KEY = OPENAI_API_KEY;
	});

	test ('should set model', async () => {
		const model = "gpt-4";
		await setModel(model);
		expect(getModel()).toBe(model);
	});

	test('should validate model name', async () => {
		const validModel = "gpt-4";
		const isValid = await validateModelName(validModel);
		expect(isValid).toBe(true);
	});

	test('should list model names', async () => {
		const modelNames = await listModelNames();
		expect(modelNames).toBeDefined();
		expect(modelNames).toContain("gpt-4");
	});

	test('should fail to set model with invalid model name', async () => {
		const invalidModel = "invalid-model";

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
		const systemPrompt = "You are a helpful assistant.";
		const userPrompt = "What is the capital of France?";

		const result = await createTextGeneration(systemPrompt, userPrompt);

		expect(result).toBeNull();
	});

	test('should generate text from OpenAI API', async () => {
		const systemPrompt = "You are a helpful assistant.";
		const userPrompt = "What is the capital of France?";

		const result = await createTextGeneration(systemPrompt, userPrompt);

		expect(result).toBeDefined();
		expect(result).toContain("Paris"); // Adjust the assertion based on the expected outcome
	});
});
