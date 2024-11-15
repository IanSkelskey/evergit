# `evergit`

![Version](https://img.shields.io/badge/version-0.0.1-blue)

![TypeScript](https://img.shields.io/badge/typescript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-00A79D?style=for-the-badge&logo=openai&logoColor=white)
![Launchpad](https://img.shields.io/badge/Launchpad-F8C300?style=for-the-badge&logo=launchpad&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

An AI git helper for the Evergreen ILS project.

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

`evergit commit`: Generates a commit message using a LLM model from OpenAI that follows the Evergreen ILS commit message format.

> Can also be run with a model name as an argument to use a different model. `evergit commit -m "gpt-3"` or `evergit commit --model "gpt-4o"`

-   Prompts the user to select files to stage.
-   Prompts the user for a Launchpad bug number.
    -   References the bug name, description and conversation when generating the commit message using the Launchpad API.
-   Automatically signs off the commit with the user's name and email from the git configuration.
