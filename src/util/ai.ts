import { getConfig } from '../cmd/config';
import { ModelProvider } from './providers/types';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

let PROVIDER: 'openai' | 'ollama' = 'openai';
let OPENAI_MODEL = 'gpt-4o';
let OLLAMA_MODEL = 'llama3.2';
let OLLAMA_BASE_URL = 'http://localhost:11434';

export function initializeFromConfig(): void {
    const config = getConfig('provider');
    if (config) {
        PROVIDER = config as 'openai' | 'ollama';
    }

    const ollamaUrl = getConfig('ollamaBaseUrl');
    if (ollamaUrl) {
        OLLAMA_BASE_URL = ollamaUrl;
    }

    const openaiModel = getConfig('openaiModel');
    if (openaiModel) {
        OPENAI_MODEL = openaiModel;
    }

    const ollamaModel = getConfig('ollamaModel');
    if (ollamaModel) {
        OLLAMA_MODEL = ollamaModel;
    }
}

function getProvider(): ModelProvider {
    return PROVIDER === 'ollama' ? new OllamaProvider(OLLAMA_BASE_URL) : new OpenAIProvider();
}

export async function setModel(modelName: string): Promise<void> {
    const provider = getProvider();
    if (!(await provider.validateModel(modelName))) {
        const modelNames = await provider.listModels();
        const availableModels = modelNames.reduce((acc, name, index) => {
            const separator = (index + 1) % 4 === 0 ? '\n\t' : ', ';
            return acc + (index === 0 ? '\t' : '') + name + separator;
        }, '');
        throw new Error(`Model name ${modelName} not found. \nAvailable ${PROVIDER} models:\n${availableModels}`);
    }
    if (PROVIDER === 'openai') {
        OPENAI_MODEL = modelName;
    } else {
        OLLAMA_MODEL = modelName;
    }
}

export function getModel(): string {
    return PROVIDER === 'openai' ? OPENAI_MODEL : OLLAMA_MODEL;
}

export function getProviderName(): string {
    return PROVIDER;
}

export function setProvider(provider: 'openai' | 'ollama'): void {
    PROVIDER = provider;
}

export function setOllamaBaseUrl(url: string): void {
    OLLAMA_BASE_URL = url;
}

export async function validateModelName(modelName: string): Promise<boolean> {
    return getProvider().validateModel(modelName);
}

export async function listModelNames(): Promise<string[]> {
    // Initialize from config if not already done
    initializeFromConfig();
    return getProvider().listModels();
}

export async function listModelsForProvider(provider: 'openai' | 'ollama', ollamaUrl?: string): Promise<string[]> {
    const modelProvider =
        provider === 'ollama' ? new OllamaProvider(ollamaUrl || OLLAMA_BASE_URL) : new OpenAIProvider();
    return modelProvider.listModels();
}

export async function createTextGeneration(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const model = getModel();
    return getProvider().createCompletion(systemPrompt, userPrompt, model);
}
