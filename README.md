# EverGit

![Version](https://img.shields.io/badge/version-0.3.1-blue)

![TypeScript](https://img.shields.io/badge/typescript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-00A79D?style=for-the-badge&logo=openai&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logoColor=white)
![Launchpad](https://img.shields.io/badge/Launchpad-F8C300?style=for-the-badge&logo=launchpad&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

An AI-powered Git helper for the Evergreen ILS project. Evergit uses OpenAI or Ollama models to generate commit messages that adhere to specific standards, streamlining the commit process while reducing manual input.

## Features

-   Generate commit messages using OpenAI's LLM models or local Ollama models.
-   Support for multiple AI providers with configurable defaults.
-   Automatically reference Launchpad bugs in commit messages.
-   Automatically sign off commits with the user's name and email.
-   Select files to stage for commit.
-   Use different models by specifying the model name as an argument.
-   Manage user-specific configuration for name, email, and AI provider settings.

## Requirements

-   `Node.js`, `npm`, and `Git` must be installed on your system.
-   For OpenAI: OpenAI API key (stored in the `OPENAI_API_KEY` environment variable)
-   For Ollama: Ollama running locally or accessible via network (optional: `OLLAMA_API_KEY` for authenticated instances)
-   A launchpad account is required to reference bugs in commit messages.

## Installation

Install `evergit` globally using npm:

```bash
npm install -g evergit
```

## Usage

`evergit` needs to be run in a git repository. It will automatically detect the repository and branch you are on. If run without any arguments, it will display the help message.

## Commands

#### `evergit commit`

Generates a commit message using a LLM model that follows the Evergreen ILS commit message format.

```bash
evergit commit  # Uses the default provider/model and prompts the user to select files to stage
```

-   Prompts the user to select files to stage.
-   Prompts the user for a Launchpad bug number.
    -   References the bug name, description and conversation when generating the commit message using the Launchpad API.
-   Automatically signs off the commit with the user's name and email from the git configuration.

##### Options

-   `-m, --model <model-name>`: Use a specific model to generate the commit message.

    ```bash
    evergit commit --model <model-name> # Uses a specific model
    ```

-   `-a, --all`: Stage all modified files for commit.

    ```bash
    evergit commit --all    # Stages all modified files
    ```

-   `-p, --provider <provider>`: Use a specific AI provider (openai or ollama).

    ```bash
    evergit commit --provider ollama    # Uses Ollama instead of default provider
    ```

#### `evergit config`

Manage user-specific configuration options for name, email, and AI provider settings. If no name and/or email is set, evergit defaults to using the git configuration.

##### Options

-   `--setup-provider`: Interactive setup for AI provider configuration.

    ```bash
    evergit config --setup-provider
    ```

-   `--set <key>`: Set a configuration option. Valid keys are `name`, `email`, `provider`, `openaiModel`, `ollamaModel`, and `ollamaBaseUrl`.

    ```bash
    evergit config --set name "Your Name"
    evergit config --set email "your.email@example.com"
    evergit config --set provider "ollama"
    evergit config --set ollamaModel "llama3.2"
    evergit config --set ollamaBaseUrl "http://localhost:11434"
    ```

-   `--get <key>`: Get a configuration option.

    ```bash
    evergit config --get provider
    evergit config --get ollamaModel
    ```

-   `--clear <key>`: Clear a configuration option.

    ```bash
    evergit config --clear provider
    ```

-   `--get-all`: Get the entire configuration.

    ```bash
    evergit config --get-all
    ```

-   `--edit`: Edit the configuration file manually in the default editor.

    ```bash
    evergit config --edit
    ```

## AI Provider Configuration

### OpenAI (Default)

Evergit uses OpenAI by default. Ensure you have the `OPENAI_API_KEY` environment variable set.

### Ollama

To use Ollama models:

1. Install and run Ollama locally (see [ollama.ai](https://ollama.ai))
2. Configure evergit to use Ollama:
    ```bash
    evergit config --setup-provider
    # Select "ollama" and follow the prompts
    ```
3. Or set manually:
    ```bash
    evergit config --set provider ollama
    evergit config --set ollamaBaseUrl "http://localhost:11434"
    evergit config --set ollamaModel "llama3.2"
    ```
