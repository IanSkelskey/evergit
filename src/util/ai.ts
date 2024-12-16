import axios from 'axios';
import { print } from './prompt';

let MODEL = 'gpt-4o';

export async function setModel(modelName: string): Promise<void> {
    if (!(await validateModelName(modelName))) {
        const modelNames = await listModelNames();
        // Join model names in a string with 4 per line and comma separated
        const availableModels = modelNames.reduce((acc, name, index) => {
            const separator = (index + 1) % 4 === 0 ? '\n\t' : ', ';
            return acc + (index === 0 ? '\t' : '') + name + separator;
        }, '');
        throw new Error('Model name ' + modelName + ' not found. \nAvailable models:\n' + availableModels);
    }
    MODEL = modelName;
}

export function getModel(): string {
    return MODEL;
}

export async function validateModelName(modelName: string): Promise<boolean> {
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

export async function listModelNames(): Promise<string[]> {
    try {
        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });
        return (response.data as { data: { id: string }[] }).data.map((model: any) => model.id);
    } catch (error) {
        throw new Error(`Error fetching model names: ${(error as Error).message}`);
    }
}

export async function createTextGeneration(system_prompt: string, user_prompt: string): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) {
        print('error', 'OpenAI API key not found. Please set it in the OPENAI_API_KEY environment variable.');
        return null;
    }
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: system_prompt,
                    },
                    { role: 'user', content: user_prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const data = response.data as { choices: { message: { content: string } }[] };
        return data.choices[0]?.message?.content?.trim() || null;
    } catch (error: any) {
        print('error', `An error occurred while generating text: ${(error as Error).message}`);
        return null;
    }
}
