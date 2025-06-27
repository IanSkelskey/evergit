import axios from 'axios';
import { print } from '../prompt';
import { ModelProvider } from './types';

export class OpenWebuiProvider implements ModelProvider {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async validateModel(modelName: string): Promise<boolean> {
        try {
            const models = await this.listModels();
            return models.includes(modelName);
        } catch (error) {
            return false;
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/models`, {
                headers: process.env.OPENWEBUI_API_KEY
                    ? { Authorization: `Bearer ${process.env.OPENWEBUI_API_KEY}` }
                    : {},
            });

            // Handle the response format where models are in a 'data' array
            const data = response.data as any;
            if (data.data && Array.isArray(data.data)) {
                return data.data.map((model: any) => model.name);
            }
            // Handle the original expected format with 'models' array
            else if (data.models && Array.isArray(data.models)) {
                return data.models.map((model: any) => model.name);
            }
            // If neither format is found, throw an error
            else {
                console.error('Unexpected API response format:', data);
                throw new Error('Unexpected Open WebUI API response format');
            }
        } catch (error) {
            throw new Error(`Error fetching Open WebUI models: ${(error as Error).message}`);
        }
    }

    async createCompletion(systemPrompt: string, userPrompt: string, model: string): Promise<string | null> {
        const endpoint =
            (this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl) + '/api/chat/completions';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (process.env.OPENWEBUI_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.OPENWEBUI_API_KEY}`;
        }

        const requestData = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        };

        console.debug('Open WebUI endpoint:', endpoint);
        console.debug('Open WebUI model:', model);
        console.debug('Request headers:', JSON.stringify(headers, null, 2));

        try {
            const response = await axios.post(endpoint, requestData, {
                headers,
                timeout: 300000, // Increase to 5 minutes for slow models
            });

            // Log the full response structure for debugging
            console.debug('Open WebUI response status:', response.status);
            console.debug('Open WebUI response headers:', response.headers);
            console.debug('Open WebUI response data type:', typeof response.data);

            if (typeof response.data === 'string') {
                console.debug('Response is string, attempting to parse...');
                try {
                    const parsedData = JSON.parse(response.data);
                    response.data = parsedData;
                } catch (parseError) {
                    console.error('Failed to parse string response:', parseError);
                    return (response.data as string).trim();
                }
            }

            console.debug('Open WebUI response structure:', JSON.stringify(response.data, null, 2));

            // Try multiple possible response structures
            const responseData = response.data as any;

            // OpenAI-compatible response structure
            if (
                responseData.choices &&
                Array.isArray(responseData.choices) &&
                responseData.choices[0]?.message?.content
            ) {
                return responseData.choices[0].message.content.trim();
            }

            // Direct message structure
            if (responseData.message?.content) {
                return responseData.message.content.trim();
            }

            // Direct content
            if (typeof responseData.content === 'string') {
                return responseData.content.trim();
            }

            // Direct response (some Open WebUI setups return just the text)
            if (typeof responseData === 'string') {
                return responseData.trim();
            }

            // If none of the above, log the structure and return null
            print('error', `Unexpected Open WebUI response structure. Check console for details.`);
            console.error('Unexpected response structure:', responseData);
            return null;
        } catch (error: any) {
            console.error('Full error object:', error);

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                print(
                    'error',
                    'Open WebUI request timed out. The model might be loading or the server is slow. Try increasing the timeout.',
                );
            } else if (error.response?.status === 403) {
                print(
                    'error',
                    'Authentication failed. Please ensure OPENWEBUI_API_KEY environment variable is set correctly.',
                );
                console.error('Response data:', error.response.data);
            } else if (error.response?.status === 404) {
                print(
                    'error',
                    `Model '${model}' not found. Please check if the model is available on your Open WebUI server.`,
                );
            } else if (error.response?.status === 500) {
                print('error', 'Open WebUI server error. Check server logs for details.');
                console.error('Server error details:', error.response.data);
            } else if (error.response) {
                print('error', `Open WebUI API error (${error.response.status}): ${error.response.statusText}`);
                if (error.response.data) {
                    console.error('Error details:', error.response.data);
                }
            } else if (error.request) {
                print('error', `No response from Open WebUI server at ${this.baseUrl}. Is the server running?`);
                console.error('Request details:', error.request);
            } else {
                print('error', `Open WebUI API error: ${error.message}`);
            }
            return null;
        }
    }
}
