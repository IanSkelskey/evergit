#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';
import { Credentials, RequestTokenAuthorizationEngine, saveCredentials, loadCredentials } from './util/launchpad';


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
            const storedCredentials = loadCredentials();

            if (storedCredentials) {
                console.log("Using stored credentials.");
                console.log("Access Token:", storedCredentials.accessToken);
                console.log("Access Token Secret:", storedCredentials.accessTokenSecret);
                return;
            }

            // If no stored credentials, go through authentication process
            const consumerKey = "evergit";
            const credentials = new Credentials(consumerKey);
            const authEngine = new RequestTokenAuthorizationEngine(consumerKey);

            try {
                await authEngine.authorize(credentials);

                if (credentials.accessToken) {
                    console.log("Authorization successful!");
                    saveCredentials(credentials.accessToken.key, credentials.accessToken.secret);
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
