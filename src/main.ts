#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';

const program = new Command();

function main(): void {

	program
		.name('evergit')
		.description('Automate your Evergreen ILS git workflow')
		.version('0.0.1');

	program
		.command('commit')
		.description('Run the evergreen commit workflow')
		.option('-m <model>', 'Set the OpenAI model to use', 'gpt-4o')
		.action(async (options) => { await commit(options.model); });

	program.parse(process.argv);

	if (!process.argv.slice(2).length) {
		program.outputHelp();
	}

}

main();