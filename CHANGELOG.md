## [0.1.0] - 2024-11-15

## Changelog Summary

-   **Enhancements:**

    -   Improved commit message handling by replacing newline characters with escape sequences for better multi-line support.
    -   Enhanced commit flow with Launchpad bug integration.

-   **Refactoring:**

    -   Refactored `commitWithMessage` function.
    -   Improved `sanitizeCommitMessage` logic to handle multi-line messages.
    -   Refactored code for better readability and error handling.

-   **Other Changes:**
    -   Utilized a temporary file for constructing git commit messages.
    -   Prettified the codebase.
