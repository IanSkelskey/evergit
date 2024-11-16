import fs from 'fs';
import { execSync } from 'child_process';
import semver, { prerelease } from 'semver';
import { createTextGeneration } from './src/util/ai';

// Function to generate changelog from commits using createTextGeneration
async function generateChangelog(commitMessages: string[]): Promise<string> {
    const systemPrompt = 'You are a helpful assistant generating a changelog based on commit messages.';
    const userPrompt = `Create a concise changelog summary for the following commits:\n\n${commitMessages.join('\n')}`;
    const changelog = await createTextGeneration(systemPrompt, userPrompt);
    return changelog || 'Error generating changelog';
}

// Function to bump the version in package.json and update README.md badge
function bumpVersion(increment: semver.ReleaseType): string {
    const packageJsonPath = './package.json';
    const readmePath = './README.md';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = semver.inc(currentVersion, increment) || currentVersion;
    packageJson.version = newVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

    // Update version badge in README.md
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const updatedReadmeContent = readmeContent.replace(
        /!\[Version\]\(https:\/\/img.shields.io\/badge\/version-[\d.]+-blue\)/,
        `![Version](https://img.shields.io/badge/version-${newVersion}-blue)`,
    );
    fs.writeFileSync(readmePath, updatedReadmeContent);
    console.log(`README.md updated with new version badge ${newVersion}`);

    return newVersion;
}

function createIncrementBadge(increment: semver.ReleaseType): string {
    // switch statement to return a string for the badge
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

// Function to append changelog to CHANGELOG.md
function updateChangelog(increment: semver.ReleaseType, version: string, changelog: string): void {
    const date = new Date().toISOString().split('T')[0];

    const incrementBadge = createIncrementBadge(increment);
    const changelogContent = `## [${version}] - ${date}\n\n${incrementBadge}\n\n${changelog}\n\n`;

    fs.appendFileSync('CHANGELOG.md', `\n${changelogContent}`);
    console.log(`Changelog updated for version ${version}`);
}

// Function to get commits unique to the current branch
function getBranchCommits(): string[] {
    try {
        // Fetch the latest changes from the main branch
        execSync('git fetch origin main');
        const commits = execSync('git log origin/main..HEAD --pretty=format:"%s"').toString().split('\n');
        return commits;
    } catch (error) {
        console.error('Error fetching branch-specific commits:', error);
        return [];
    }
}

// Main function to run the bump and changelog
async function main() {
    const increment: semver.ReleaseType = (process.argv[2] as semver.ReleaseType) || 'patch';
    const newVersion = bumpVersion(increment);

    const commitMessages = getBranchCommits();
    const changelog = await generateChangelog(commitMessages);

    updateChangelog(increment, newVersion, changelog);

    // Run npm install
    execSync('npm install'); // Update dependencies

    console.log(changelog); // Output changelog for CI use
}

main();
