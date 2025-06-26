# EverGit Changelog

This file is written automatically by the [version bump script](version-bump.ts) and powered by OpenAI's `gpt-4o` model. The script generates a changelog entry based on the commit messages since the last release. The changelog is then updated with the new entry and the version number is bumped accordingly.

## [0.1.0] - 2024-11-15

### Changelog Summary

-   Enhanced version bump and changelog handling.
-   Improved commit flow with Launchpad bug integration.
-   Enhanced commit message handling by improved sanitization logic, specifically replacing newline characters with escape sequences for better multi-line support.
-   Refactored code for improved readability and error handling.
-   Utilized temporary files for git commit message construction.
-   General code prettification and refactoring for better code organization and functionality.

## [0.1.1] - 2024-11-16

![Increment](https://img.shields.io/badge/patch-purple)

### Changelog Summary

-   Enhanced commit workflow:
    -   Added a feedback loop for improved user interaction.
    -   Introduced an option to unstage changes.

## [0.1.2] - 2024-11-17

![Increment](https://img.shields.io/badge/patch-purple)

### Changelog Summary

#### New Features

-   Added test job to GitHub Actions workflow.
-   Enhanced CLI options and updated version handling in evergit.

#### Improvements

-   Added code coverage reports and refactored tests
-   Implemented error handling for model settings with a list of available models
-   Updated README with npm install and usage instructions.
-   Added changelog generation details to the `CHANGELOG.md`.
-   Introduced option for staging all files during commit.
-   Added `ts-prune` to check for unused exports.

#### Refactoring

-   Refactored diff retrieval to exclude specific files.

#### Code Quality

-   Prettified code in multiple instances.

#### Maintenance

-   Added `.VSCodeCounter/` to `.gitignore` for a cleaner repository.
-   Removed generated coverage files from the repository and updated `.gitignore` accordingly.
-   Cleaned up coverage files and ignored them in future commits.

#### Fixes

-   Added a success message after the commit operation is performed.

## [0.1.3] - 2024-11-19

![Increment](https://img.shields.io/badge/patch-purple)

### Changelog Summary

-   **Enhancements:**

    -   Improved buffer handling in the `getDiffForStagedFiles` function.
    -   Enhanced the CLI main function and added corresponding tests.

-   **Testing:**

    -   Added integration tests for Git utilities.

-   **Code Quality:**

    -   Prettified codebase for improved readability.

-   **Merges:**
    -   Merged branch 'dev' from the repository.

## [0.1.4] - 2024-12-16

![Increment](https://img.shields.io/badge/patch-purple)

# Changelog Summary

-   Refactored AI utility to use Axios instead of OpenAI client.
-   Improved code readability by applying code formatting (Prettified Code).
-   Merged changes from the 'main' branch into 'dev'.

## [0.2.0] - 2025-01-01

![Increment](https://img.shields.io/badge/minor-orange)

# Changelog Summary

-   Added user-specific configuration management to the Evergit tool.
-   Enhanced the configuration management system within Evergit.
-   Removed the `open` package and its type definitions from dependencies.
-   Applied code formatting improvements for better readability.

## [0.2.1] - 2025-06-26

![Increment](https://img.shields.io/badge/patch-purple)

# Changelog

-   **Error Handling:**

    -   Improved error handling in the `getCurrentBranchName` function.
    -   Enhanced the `getCurrentBranchName` function to support new repositories and the detached HEAD state.
    -   Provided error guidance for missing Git user configuration.

-   **Testing:**

    -   Refactored Git utilities tests for style consistency.
    -   Added detailed integration tests for Git utilities.
    -   Added test for `getGitRootDir` utility function.

-   **Features:**

    -   Added git root directory support to Git functions.

-   **Code Quality:**
    -   Prettified code for better readability and consistency.

## [0.3.0] - 2025-06-26

![Increment](https://img.shields.io/badge/minor-orange)

# Changelog

### Enhancements

-   Enhanced Evergit to support multiple AI providers (OpenAI and Ollama) with configurable settings, including model selection and base URL.
-   Updated README with new features and usage instructions.

### Improvements

-   Improved CLI tests for provider parameter.
-   Updated model configuration prompts to fetch and display available models.

### Maintenance

-   Prettified codebase.
-   Updated `node_modules/@babel/code-frame`.

### Documentation

-   Added instructions for testing Evergit as a global command.

## [0.3.1] - 2025-06-26

![Increment](https://img.shields.io/badge/patch-purple)

## Changelog Summary

-   **GitHub Actions Workflow Enhancements**

    -   Updated workflows to include explicit permissions for improved security and clarity.

-   **Commit Message Sanitizer Fix**
    -   Escaped backslashes before double quotes to ensure correct processing of commit messages.
