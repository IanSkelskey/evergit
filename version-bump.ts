import fs from 'fs';
import { execSync } from 'child_process';
import semver from 'semver';
import { createTextGeneration } from './src/util/ai';

// Function to generate changelog from commits using createTextGeneration
async function generateChangelog(commitMessages: string[]): Promise<string> {
    const systemPrompt = 'You are a helpful assistant generating a changelog based on commit messages.';
    const userPrompt = `Create a concise changelog summary for the following commits:\n\n${commitMessages.join('\n')}`;
    const changelog = await createTextGeneration(systemPrompt, userPrompt);
    return changelog || 'Error generating changelog';
}

// Function to bump the version in package.json
function bumpVersion(increment: semver.ReleaseType): string {
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = semver.inc(currentVersion, increment) || currentVersion;
    packageJson.version = newVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
    return newVersion;
}

// Function to append changelog to CHANGELOG.md
function updateChangelog(version: string, changelog: string): void {
    const date = new Date().toISOString().split('T')[0];
    const changelogContent = `## [${version}] - ${date}\n\n${changelog}\n\n`;

    fs.appendFileSync('CHANGELOG.md', changelogContent);
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
    const increment: semver.ReleaseType = process.argv[2] as semver.ReleaseType || 'patch';
    const newVersion = bumpVersion(increment);

    const commitMessages = getBranchCommits();
    const changelog = await generateChangelog(commitMessages);

    updateChangelog(newVersion, changelog);

    console.log(changelog);  // Output changelog for CI use
}

main();
