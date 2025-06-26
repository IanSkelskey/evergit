import fs from 'fs';
import { execSync } from 'child_process';
import semver, { ReleaseType } from 'semver';
import { createTextGeneration } from './src/util/ai';
import ora from 'ora';

async function generateChangelog(commitMessages: string[]): Promise<string> {
    const spinner = ora('Generating changelog from commit messages...').start();
    const systemPrompt = 'You are a helpful assistant generating a changelog based on commit messages.';
    const userPrompt = `Create a concise changelog summary for the following commits:\n\n${commitMessages.join('\n')}`;
    const changelog = await createTextGeneration(systemPrompt, userPrompt);
    spinner.stop();
    return changelog || 'Error generating changelog';
}

function bumpVersion(increment: ReleaseType): string {
    const packageJsonPath = './package.json';
    const readmePath = './README.md';
    const mainFilePath = './src/main.ts'; // Define path to main.ts

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = semver.inc(currentVersion, increment) || currentVersion;
    packageJson.version = newVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

    // Update version badge in README.md
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const updatedReadmeContent = readmeContent.replace(
        /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[\d.]+-blue\)/,
        `![Version](https://img.shields.io/badge/version-${newVersion}-blue)`,
    );
    fs.writeFileSync(readmePath, updatedReadmeContent);
    console.log(`README.md updated with new version badge ${newVersion}`);

    // Update version in main.ts
    const mainFileContent = fs.readFileSync(mainFilePath, 'utf8');
    const updatedMainFileContent = mainFileContent.replace(
        /(program\.name\('evergit'\)\.description\('Automate your Evergreen ILS git workflow'\)\.version\(')([\d.]+)('\);)/,
        `$1${newVersion}$3`,
    );
    fs.writeFileSync(mainFilePath, updatedMainFileContent);
    console.log(`src/main.ts updated to new version ${newVersion}`);

    return newVersion;
}

function createIncrementBadge(increment: ReleaseType): string {
    switch (increment) {
        case 'major':
            return '![Increment](https://img.shields.io/badge/major-red)';
        case 'premajor':
            return '![Increment](https://img.shields.io/badge/premajor-red)';
        case 'minor':
            return '![Increment](https://img.shields.io/badge/minor-orange)';
        case 'preminor':
            return '![Increment](https://img.shields.io/badge/preminor-orange)';
        case 'patch':
            return '![Increment](https://img.shields.io/badge/patch-purple)';
        case 'prepatch':
            return '![Increment](https://img.shields.io/badge/prepatch-purple)';
        case 'prerelease':
            return '![Increment](https://img.shields.io/badge/prerelease-green)';
        default:
            throw new Error('Invalid increment type');
    }
}

function updateChangelog(increment: ReleaseType, version: string, changelog: string): void {
    const date = new Date().toISOString().split('T')[0];
    const incrementBadge = createIncrementBadge(increment);
    const changelogContent = `## [${version}] - ${date}\n\n${incrementBadge}\n\n${changelog}\n\n`;

    fs.appendFileSync('CHANGELOG.md', `\n${changelogContent}`);
    console.log(`Changelog updated for version ${version}`);
}

function getBranchCommits(): string[] {
    try {
        execSync('git fetch origin main');
        const commits = execSync('git log origin/main..HEAD --pretty=format:"%s"').toString().split('\n');
        return commits;
    } catch (error) {
        console.error('Error fetching branch-specific commits:', error);
        return [];
    }
}

async function main() {
    const increment: ReleaseType = (process.argv[2] as ReleaseType) || 'patch';
    const newVersion = bumpVersion(increment);

    const commitMessages = getBranchCommits();
    const changelog = await generateChangelog(commitMessages);

    updateChangelog(increment, newVersion, changelog);

    execSync('npm install');
    console.log(changelog);
}

main();
