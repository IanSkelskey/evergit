#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';

const program = new Command();

function main(): void {
    program.name('evergit').description('Automate your Evergreen ILS git workflow').version('0.0.1');

    program
        .command('commit')
        .description('Run the evergreen commit workflow. Requires a OPENAI_API_KEY environment variable to be set.')
        .option('-m, --model <model>', 'Set the OpenAI model to use', 'gpt-4o')
        .option('-a, --all', 'Add all files to the commit')
        .action(async (options) => {
            await commit(options.model, options.all);
        });

    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

main();
