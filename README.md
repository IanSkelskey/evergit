# EverGit

![Version](https://img.shields.io/badge/version-0.1.0-blue)

![TypeScript](https://img.shields.io/badge/typescript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-00A79D?style=for-the-badge&logo=openai&logoColor=white)
![Launchpad](https://img.shields.io/badge/Launchpad-F8C300?style=for-the-badge&logo=launchpad&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

An AI-powered Git helper for the Evergreen ILS project. Evergit uses OpenAI’s models to generate commit messages that adhere to specific standards, streamlining the commit process while reducing manual input.

## Features

-   Generate commit messages using OpenAI's LLM models.
-   Automatically reference Launchpad bugs in commit messages.
-   Automatically sign off commits with the user's name and email.
-   Select files to stage for commit.
-   Use different models by specifying the model name as an argument.

## Requirements

-   `Node.js`, `npm`, and `Git` must be installed on your system.
-   OpenAI API key (stored in the `OPENAI_API_KEY` environment variable)
-   A launchpad account is required to reference bugs in commit messages.

## Installation

```bash
npm install -g evergit
```

## Usage

`evergit` needs to be run in a git repository. It will automatically detect the repository and branch you are on. If run without any arguments, it will display the help message.

```bash
evergit
```

## Commands

#### `evergit commit`

Generates a commit message using a LLM model from OpenAI that follows the Evergreen ILS commit message format.

```bash
evergit commit                      # Uses the default model
```

-   Prompts the user to select files to stage.
-   Prompts the user for a Launchpad bug number.
    -   References the bug name, description and conversation when generating the commit message using the Launchpad API.
-   Automatically signs off the commit with the user's name and email from the git configuration.

##### Options

-   `--model <model-name>`: Use a specific model to generate the commit message.

```bash
evergit commit --model <model-name> # Uses a specific model
```
