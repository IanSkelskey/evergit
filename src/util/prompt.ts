import inquirer from 'inquirer';
import chalk from 'chalk';

const colors: Record<string, (message: string) => string> = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    content: chalk.grey,
};

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

export function showHelpMenu(): void {
    print('info', 'Usage: evergit [options]');
    print('info', 'Options:');
    print('content', '  -h, --help\t\tShow this help menu');
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
