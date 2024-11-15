#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';
import { Credentials, RequestTokenAuthorizationEngine } from './util/launchpad';


const program = new Command();

function main(): void {
    program.name('evergit').description('Automate your Evergreen ILS git workflow').version('0.0.1');

    program
        .command('commit')
        .description('Run the evergreen commit workflow. Requires a OPENAI_API_KEY environment variable to be set.')
        .option('-m <model>', 'Set the OpenAI model to use', 'gpt-4o')
        .action(async (options) => {
            await commit(options.model);
        });


    program
        .command('launchpad')
        .description('Test Launchpad API integration')
        .action(async () => {
            // Define the consumer key for your application (replace this with your actual consumer key)
            const consumerKey = "evergit";

            try {
                // Step 1: Initialize credentials with the consumer key
                const credentials = new Credentials(consumerKey);

                // Step 2: Set up the authorization engine with Launchpad root URL and application name
                const authEngine = new RequestTokenAuthorizationEngine(consumerKey);

                // Step 3: Begin the authorization process
                await authEngine.authorize(credentials);

                if (credentials.accessToken) {
                    console.log("Authorization successful!");
                    console.log("Access Token:", credentials.accessToken.key);
                    console.log("Access Token Secret:", credentials.accessToken.secret);
                } else {
                    console.log("Authorization failed or was declined by the user.");
                }
            } catch (error) {
                console.error("An error occurred during the Launchpad authentication process.");
                console.error(error);
            }
        });

    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

main();
