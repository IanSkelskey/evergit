#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';
import { setConfig, getConfig, clearConfig, getAllConfig, isValidKey, CONFIG_PATH } from './cmd/config';
import { selectProvider, promptOllamaSetup, selectModel } from './util/prompt';
import { listModelsForProvider } from './util/ai';
import inquirer from 'inquirer';
import { exec } from 'child_process';

const program = new Command();

function getGitEditor(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec('git config --get core.editor', (error, stdout) => {
            if (error) {
                resolve('code'); // Fallback to VS Code if no editor is set
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export async function main(args = process.argv): Promise<void> {
    program.name('evergit').description('Automate your Evergreen ILS git workflow').version('0.2.1');

    program
        .command('commit')
        .description('Run the evergreen commit workflow. Requires API keys to be set.')
        .option('-m, --model <model>', 'Set the AI model to use')
        .option('-a, --all', 'Add all files to the commit')
        .option('-p, --provider <provider>', 'Set the AI provider (openai or ollama)')
        .action(async (options) => {
            await commit(options.model, options.all, options.provider);
        });

    program
        .command('config')
        .description('Set, get, clear, or edit configuration options')
        .option('--set <key>', 'Set a configuration option')
        .option('--get <key>', 'Get a configuration option')
        .option('--clear <key>', 'Clear a configuration option')
        .option('--get-all', 'Get the entire configuration')
        .option('--edit', 'Edit the configuration file manually')
        .option('--setup-provider', 'Setup AI provider configuration')
        .action(async (options) => {
            if (options.setupProvider) {
                const provider = await selectProvider();
                setConfig('provider', provider);

                if (provider === 'ollama') {
                    const { baseUrl } = await inquirer.prompt({
                        type: 'input',
                        name: 'baseUrl',
                        message: 'Enter the Ollama base URL:',
                        default: 'http://localhost:11434',
                    });
                    setConfig('ollamaBaseUrl', baseUrl);

                    try {
                        console.log('Fetching available Ollama models...');
                        const models = await listModelsForProvider('ollama', baseUrl);
                        if (models.length === 0) {
                            console.error('No models found. Please ensure Ollama is running and has models installed.');
                            return;
                        }
                        const model = await selectModel(models, 'Select the default Ollama model:', 'llama3.2');
                        setConfig('ollamaModel', model);
                        console.log(`Ollama configured with base URL: ${baseUrl} and model: ${model}`);
                    } catch (error) {
                        console.error('Failed to fetch Ollama models. Please ensure Ollama is running.');
                        console.error(`Error: ${(error as Error).message}`);
                    }
                } else {
                    if (!process.env.OPENAI_API_KEY) {
                        console.error('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
                        return;
                    }
                    try {
                        console.log('Fetching available OpenAI models...');
                        const models = await listModelsForProvider('openai');
                        const gptModels = models.filter(m => m.startsWith('gpt'));
                        const model = await selectModel(gptModels, 'Select the default OpenAI model:', 'gpt-4o');
                        setConfig('openaiModel', model);
                        console.log(`OpenAI configured with model: ${model}`);
                    } catch (error) {
                        console.error('Failed to fetch OpenAI models. Please check your API key.');
                        console.error(`Error: ${(error as Error).message}`);
                    }
                }
                console.log(`Provider set to: ${provider}`);
                return;
            }

            if (options.set) {
                if (!isValidKey(options.set)) {
                    console.log(`Invalid configuration key: ${options.set}`);
                    console.log(`Valid keys are: name, email, provider, openaiModel, ollamaModel, ollamaBaseUrl`);
                    return;
                }

                if (options.set === 'provider') {
                    const provider = await selectProvider();
                    setConfig('provider', provider);
                    console.log(`Provider set to: ${provider}`);

                    if (provider === 'ollama' && !getConfig('ollamaBaseUrl')) {
                        const { baseUrl } = await inquirer.prompt({
                            type: 'input',
                            name: 'baseUrl',
                            message: 'Enter the Ollama base URL:',
                            default: 'http://localhost:11434',
                        });
                        setConfig('ollamaBaseUrl', baseUrl);

                        try {
                            const models = await listModelsForProvider('ollama', baseUrl);
                            if (models.length > 0) {
                                const model = await selectModel(models, 'Select the default Ollama model:', 'llama3.2');
                                setConfig('ollamaModel', model);
                            }
                        } catch (error) {
                            console.error('Failed to fetch Ollama models.');
                        }
                    }
                    return;
                }

                if (options.set === 'openaiModel') {
                    if (!process.env.OPENAI_API_KEY) {
                        console.error('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
                        return;
                    }
                    try {
                        console.log('Fetching available OpenAI models...');
                        const models = await listModelsForProvider('openai');
                        const gptModels = models.filter(m => m.startsWith('gpt'));
                        const model = await selectModel(gptModels, 'Select the OpenAI model:');
                        setConfig('openaiModel', model);
                        console.log(`OpenAI model set to: ${model}`);
                    } catch (error) {
                        console.error('Failed to fetch OpenAI models.');
                    }
                    return;
                }

                if (options.set === 'ollamaModel') {
                    const baseUrl = getConfig('ollamaBaseUrl') || 'http://localhost:11434';
                    try {
                        console.log('Fetching available Ollama models...');
                        const models = await listModelsForProvider('ollama', baseUrl);
                        if (models.length === 0) {
                            console.error('No models found. Please ensure Ollama is running and has models installed.');
                            return;
                        }
                        const model = await selectModel(models, 'Select the Ollama model:');
                        setConfig('ollamaModel', model);
                        console.log(`Ollama model set to: ${model}`);
                    } catch (error) {
                        console.error('Failed to fetch Ollama models. Please ensure Ollama is running.');
                    }
                    return;
                }

                const { value } = await inquirer.prompt({
                    type: 'input',
                    name: 'value',
                    message: `Enter the value for ${options.set}:`,
                });
                setConfig(options.set, value);
                console.log(`Configuration ${options.set} set to ${value}`);
            } else if (options.get) {
                if (!isValidKey(options.get)) {
                    console.log(`Invalid configuration key: ${options.get}`);
                    console.log(`Valid keys are: name, email`);
                    return;
                }
                const value = getConfig(options.get);
                if (value) {
                    console.log(`${options.get}: ${value}`);
                } else {
                    console.log(`Configuration ${options.get} not found`);
                }
            } else if (options.clear) {
                if (!isValidKey(options.clear)) {
                    console.log(`Invalid configuration key: ${options.clear}`);
                    console.log(`Valid keys are: name, email`);
                    return;
                }
                clearConfig(options.clear);
                console.log(`Configuration ${options.clear} cleared`);
            } else if (options.getAll) {
                const config = getAllConfig();
                console.log('Current configuration:', config);
            } else if (options.edit) {
                const editor = await getGitEditor();
                exec(`${editor} ${CONFIG_PATH}`, (error) => {
                    if (error) {
                        console.error('Failed to open the editor:', error);
                    }
                });
            } else {
                program.outputHelp();
            }
        });

    program.parse(args);

    if (!args.slice(2).length) {
        program.outputHelp();
    }
}

if (require.main === module) {
    main();
}
