# EverGit Changelog

This file is written automatically by the [version bump script](version-bump.ts) and powered by OpenAI's `gpt-4o` model. The script generates a changelog entry based on the commit messages since the last release. The changelog is then updated with the new entry and the version number is bumped accordingly.

## [0.1.0] - 2024-11-15

## Changelog Summary

-   Enhanced version bump and changelog handling.
-   Improved commit flow with Launchpad bug integration.
-   Enhanced commit message handling by improved sanitization logic, specifically replacing newline characters with escape sequences for better multi-line support.
-   Refactored code for improved readability and error handling.
-   Utilized temporary files for git commit message construction.
-   General code prettification and refactoring for better code organization and functionality.

## [0.1.1] - 2024-11-16

![Increment](https://img.shields.io/badge/patch-purple)

### Changelog

-   Enhanced commit workflow:
    -   Added a feedback loop for improved user interaction.
    -   Introduced an option to unstage changes.
