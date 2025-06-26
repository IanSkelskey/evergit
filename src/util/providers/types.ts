export interface ModelProvider {
    validateModel(modelName: string): Promise<boolean>;
    listModels(): Promise<string[]>;
    createCompletion(systemPrompt: string, userPrompt: string, model: string): Promise<string | null>;
}
