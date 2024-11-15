#!/usr/bin/env node

import { Command } from 'commander';
import commit from './cmd/commit';
import { getRequestToken, getAccessToken, makeAuthenticatedRequest } from './util/launchpad';

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
            await testLaunchpadIntegration();
        });

    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

async function testLaunchpadIntegration() {
    try {
        // Step 1: Get request token
        const { requestToken, requestTokenSecret } = await getRequestToken();

        if (!requestToken || !requestTokenSecret) {
            throw new Error('Failed to retrieve request token and secret.');
        }

        console.log('Authorize the app by visiting the following URL and entering the verifier code:');
        console.log(`https://launchpad.net/+authorize-token?oauth_token=${requestToken}`);

        // Prompt user to enter the verifier code manually
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question('Enter the verifier code: ', async (verifier: string) => {
            readline.close();

            // Step 2: Exchange request token for access token
            const { accessToken, accessTokenSecret } = await getAccessToken(requestToken, requestTokenSecret, verifier);
            console.log('Access token and secret retrieved successfully.');

            if (!accessToken || !accessTokenSecret) {
                throw new Error('Failed to retrieve access token and secret.');
            }

            // Step 3: Make a test authenticated request
            const bugId = 1;  // Example bug ID for testing
            const response = await makeAuthenticatedRequest(`https://api.launchpad.net/1.0/bugs/${bugId}`, accessToken, accessTokenSecret);
            console.log('Authenticated request successful. Launchpad API response:');
            console.log(response);
        });
    } catch (error) {
        console.error('Error in Launchpad test integration:', error);
    }
}

main();
