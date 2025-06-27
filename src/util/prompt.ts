import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

const colors: Record<string, (message: string) => string> = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    content: chalk.grey,
};

export async function waitForAuthorization(authUrl: string): Promise<void> {
    print('info', `Please authorize the app by visiting this URL: ${authUrl}`);
    await inquirer.prompt({
        type: 'input',
        name: 'authorization',
        message: 'Press Enter once you have completed the authorization in the browser.',
    });
}

export async function confirmCommitMessage(commitMessage: string): Promise<boolean> {
    print('info', 'Commit message:');
    print('content', commitMessage);
    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'commit',
        message: `Do you want to commit with this message?`,
    });
    return answer.commit;
}

export async function requestLaunchpadBugNumber(): Promise<string> {
    const confirm = await inquirer.prompt({
        type: 'confirm',
        name: 'hasBug',
        message: 'Is this commit related to a Launchpad bug?',
    });
    if (!confirm.hasBug) {
        return '';
    }
    const answer = await inquirer.prompt({
        type: 'input',
        name: 'bugNumber',
        message: 'Enter the Launchpad bug number:',
    });
    return answer.bugNumber;
}

export async function requestFeedback(): Promise<string> {
    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'tryAgain',
        message: 'Would you like to provide feedback on the commit message and try again?',
    });
    if (!answer.tryAgain) {
        return '';
    }

    const feedbackAnswer = await inquirer.prompt({
        type: 'input',
        name: 'feedback',
        message: 'Please provide feedback:',
    });
    return feedbackAnswer.feedback;
}

export async function selectFilesToStage(files: string[]): Promise<string[]> {
    const answer = await inquirer.prompt({
        type: 'checkbox',
        name: 'files',
        message: 'Select files to stage:',
        choices: files,
    });
    return answer.files;
}

export async function promptOpenWebuiSetup(): Promise<{ baseUrl: string; model: string }> {
    print('info', 'Setting up Open WebUI for the first time...');

    const { baseUrl } = await inquirer.prompt({
        type: 'input',
        name: 'baseUrl',
        message: 'Enter the Open WebUI base URL:',
        default: 'http://localhost:8080',
    });

    const { model } = await inquirer.prompt({
        type: 'input',
        name: 'model',
        message: 'Enter the default Open WebUI model to use:',
        default: 'llama3.2',
    });

    return { baseUrl, model };
}

export async function selectProvider(): Promise<'openai' | 'openwebui'> {
    const { provider } = await inquirer.prompt({
        type: 'list',
        name: 'provider',
        message: 'Select the AI provider:',
        choices: ['openai', 'openwebui'],
        default: 'openai',
    });
    return provider;
}

export async function selectModel(models: string[], message: string, defaultModel?: string): Promise<string> {
    const { model } = await inquirer.prompt({
        type: 'list',
        name: 'model',
        message,
        choices: models,
        default: defaultModel,
        pageSize: 10, // Show 10 models at a time for better navigation
    });
    return model;
}

export function print(type: string, message: string): void {
    if (type === 'error') {
        console.error(colors[type](message));
        return;
    } else if (type === 'warning') {
        console.warn(colors[type](message));
        return;
    } else if (!colors[type]) {
        throw new Error(`Invalid message type: ${type}`);
    }

    console.log(colors[type](message));
}

/**
 * Creates and returns a spinner with the given text
 * @param text The text to display next to the spinner
 * @returns An ora spinner instance
 */
export function createSpinner(text: string): Ora {
    return ora({
        text,
        color: 'blue',
    });
}
