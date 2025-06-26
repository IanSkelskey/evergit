#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';
import { setConfig, getConfig, clearConfig, getAllConfig, isValidKey, CONFIG_PATH } from './cmd/config';
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
        .description('Run the evergreen commit workflow. Requires a OPENAI_API_KEY environment variable to be set.')
        .option('-m, --model <model>', 'Set the OpenAI model to use', 'gpt-4o')
        .option('-a, --all', 'Add all files to the commit')
        .action(async (options) => {
            await commit(options.model, options.all);
        });

    program
        .command('config')
        .description('Set, get, clear, or edit configuration options')
        .option('--set <key>', 'Set a configuration option')
        .option('--get <key>', 'Get a configuration option')
        .option('--clear <key>', 'Clear a configuration option')
        .option('--get-all', 'Get the entire configuration')
        .option('--edit', 'Edit the configuration file manually')
        .action(async (options) => {
            if (options.set) {
                if (!isValidKey(options.set)) {
                    console.log(`Invalid configuration key: ${options.set}`);
                    console.log(`Valid keys are: name, email`);
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
