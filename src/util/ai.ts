import { getConfig } from '../cmd/config';
import { ModelProvider } from './providers/types';
import { OpenAIProvider } from './providers/openai';
import { OpenWebuiProvider } from './providers/open_webui';

let PROVIDER: 'openai' | 'openwebui' = 'openai';
let OPENAI_MODEL = 'gpt-4o';
let OPENWEBUI_MODEL = 'llama3.2';
let OPENWEBUI_BASE_URL = 'http://localhost:11434';

export function initializeFromConfig(): void {
    const config = getConfig('provider');
    if (config) {
        PROVIDER = config as 'openai' | 'openwebui';
    }

    const openwebuiUrl = getConfig('openwebuiBaseUrl');
    if (openwebuiUrl) {
        OPENWEBUI_BASE_URL = openwebuiUrl;
    }

    const openaiModel = getConfig('openaiModel');
    if (openaiModel) {
        OPENAI_MODEL = openaiModel;
    }

    const openwebuiModel = getConfig('openwebuiModel');
    if (openwebuiModel) {
        OPENWEBUI_MODEL = openwebuiModel;
    }
}

function getProvider(): ModelProvider {
    return PROVIDER === 'openwebui' ? new OpenWebuiProvider(OPENWEBUI_BASE_URL) : new OpenAIProvider();
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
        OPENWEBUI_MODEL = modelName;
    }
}

export function getModel(): string {
    return PROVIDER === 'openai' ? OPENAI_MODEL : OPENWEBUI_MODEL;
}

export function getProviderName(): string {
    return PROVIDER;
}

export function setProvider(provider: 'openai' | 'openwebui'): void {
    PROVIDER = provider;
}

export function setOpenWebuiBaseUrl(url: string): void {
    OPENWEBUI_BASE_URL = url;
}

export async function validateModelName(modelName: string): Promise<boolean> {
    return getProvider().validateModel(modelName);
}

export async function listModelNames(): Promise<string[]> {
    // Initialize from config if not already done
    initializeFromConfig();
    return getProvider().listModels();
}

export async function listModelsForProvider(
    provider: 'openai' | 'openwebui',
    openwebuiUrl?: string,
): Promise<string[]> {
    const modelProvider =
        provider === 'openwebui' ? new OpenWebuiProvider(openwebuiUrl || OPENWEBUI_BASE_URL) : new OpenAIProvider();
    return modelProvider.listModels();
}

export async function createTextGeneration(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const model = getModel();
    return getProvider().createCompletion(systemPrompt, userPrompt, model);
}
