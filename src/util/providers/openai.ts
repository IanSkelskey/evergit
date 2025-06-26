import axios from 'axios';
import { print } from '../prompt';
import { ModelProvider } from './types';

export class OpenAIProvider implements ModelProvider {
    async validateModel(modelName: string): Promise<boolean> {
        try {
            const response = await axios.get(`https://api.openai.com/v1/models/${modelName}`, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await axios.get('https://api.openai.com/v1/models', {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            });
            return (response.data as { data: { id: string }[] }).data.map((model: any) => model.id);
        } catch (error) {
            throw new Error(`Error fetching OpenAI models: ${(error as Error).message}`);
        }
    }

    async createCompletion(systemPrompt: string, userPrompt: string, model: string): Promise<string | null> {
        if (!process.env.OPENAI_API_KEY) {
            print('error', 'OpenAI API key not found. Please set it in the OPENAI_API_KEY environment variable.');
            return null;
        }
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            const data = response.data as { choices: { message: { content: string } }[] };
            return data.choices[0]?.message?.content?.trim() || null;
        } catch (error: any) {
            print('error', `OpenAI API error: ${(error as Error).message}`);
            return null;
        }
    }
}
