# Contributing to Evergit

We appreciate your interest in contributing to **Evergit**! This document outlines the process for contributing code, testing, and submitting pull requests.

## How to Contribute

### 1. Fork the Repository

1. [**Fork the Repository**](https://github.com/IanSkelskey/evergit/fork)
2. Clone your fork to your local machine:
    ```bash
    git clone https://github.com/<your-username>/evergit.git
    ```
3. Add the original repository as an upstream remote:
    ```bash
    git remote add upstream https://github.com/IanSkelskey/evergit.git
    ```

### 2. Work on Your Feature or Fix

1. Create a new branch for your changes, based on the `dev` branch:
    ```bash
    git checkout dev
    git pull upstream dev
    git checkout -b feature/your-feature-name
    ```
2. Make your changes, commit them, and push the branch to your fork:
    ```bash
    git add .
    git commit -m "Add your meaningful commit message here"
    git push origin feature/your-feature-name
    ```

### 3. Open a Pull Request

1. Navigate to the [Pull Requests](https://github.com/IanSkelskey/evergit/pulls) section of the Evergit repository.
2. Click **New Pull Request** and select:
    - **Base branch:** `dev`
    - **Compare branch:** `feature/your-feature-name` (or the branch you created)
3. Provide a detailed description of the changes in the pull request template and link to any related issues.
4. Submit the pull request.

### 4. Preparing for Merging into `main`

Before a pull request is merged into the `main` branch, ensure:

1. The code is fully tested and passes all checks.
2. The version bump script is executed (see below).

---

## Running the Code Locally

1. **Clone the repository:**

    ```bash
    git clone https://github.com/<your-username>/evergit.git
    cd evergit
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Run the project:**
   To execute the project locally:

    ```bash
    npm start
    ```

4. **Run a specific command:**
   For example, to test the `commit` command:
    ```bash
    npm start commit -- -a
    ```

---

## Testing the Code

This project uses Jest for testing. To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test <test-file-name>
```

Ensure all tests pass before submitting your pull request.

---

## Formatting the Code

To ensure consistent code formatting, use the provided Prettier script. Run the following command to format the entire codebase:

```bash
npm run format
```

To check for formatting issues without applying changes:

```bash
npm run format-check
```

---

## Running the Version Bump Script

Before opening a pull request into the `main` branch, you must run the version bump script to increment the version number and update the changelog.

### Steps:

1. **Run the script:**

    ```bash
    npm run version-bump -- <increment>
    ```

    Replace `<increment>` with one of the following:

    - `major`: For breaking changes
    - `minor`: For new features
    - `patch`: For bug fixes (default if no increment is specified)

2. **Commit the updated files:**
   The script will automatically:

    - Update `package.json` and `package-lock.json` with the new version.
    - Update the version badge in `README.md`.
    - Update the version in `src/main.ts`.
    - Append the changelog in `CHANGELOG.md`.

    After running the script, commit the changes:

    ```bash
    git add package.json package-lock.json README.md CHANGELOG.md src/main.ts
    git commit -m "Bump version for release"
    ```

3. **Push the updated version:**
    ```bash
    git push origin feature/your-feature-name
    ```

---

## Code Guidelines

-   Follow the existing coding style and conventions.
-   Document your code where necessary.
-   Ensure the code is clean and free of console logs or unnecessary comments before submitting.

---

## Communication and Support

If you have questions or need help, feel free to open a discussion or contact the maintainers via the issue tracker.

Thank you for contributing to Evergit!
