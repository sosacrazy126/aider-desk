# Feature Request: Power Tools

## Description:
Implement a set of specific AI tools designed to assist with coding tasks within a project. These tools should enable the Agent to perform actions like finding files, reading/writing content, executing commands, and interacting with project-specific configurations and code quality checks.

## Motivation:
To enhance the Agent's capability as a coding assistant, it needs direct access to project files and the ability to execute common development operations programmatically. This set of tools will provide the Agent with the necessary interface to understand, modify, and interact with the codebase effectively.

## Proposed Tools:

The following tools are proposed to enhance the Agent's capabilities. Consideration should be given to leveraging or extending existing functionalities where appropriate (e.g., tools in `aider-desk-mcp-server.ts` or commands in `connector.py`).

*   **FileEdit**:
    *   **Description**: Atomically finds and replaces a specific string or pattern within a specified file. This tool is useful for making targeted changes to file content.
    *   **Parameters**:
        *   `filePath`: string - The path to the file to be edited (relative to the project root).
        *   `searchTerm`: string - The string or regular expression to find in the file.
        *   `replacementText`: string - The string to replace the `searchTerm` with.
        *   `isRegex`: boolean (optional, default: `false`) - Whether the `searchTerm` should be treated as a regular expression.
        *   `replaceAll`: boolean (optional, default: `false`) - Whether to replace all occurrences or just the first one.
    *   **Behavior**: Reads the specified file, performs the find and replace operation, and writes the modified content back to the file.
    *   **Output**: A success message indicating the file was edited (e.g., `Successfully edited 'src/components/Button.tsx'.`) or an error message if the file was not found or the operation failed (e.g., `Error: File 'src/nonexistent.ts' not found.`).

*   **FileRead**:
    *   **Description**: Reads and returns the content of a specified file. Useful for inspecting file contents without adding them to the Aider context.
    *   **Parameters**:
        *   `filePath`: string - The path to the file to be read (relative to the project root).
    *   **Behavior**: Reads the content of the specified file.
    *   **Output**: The content of the file as a string (e.g., `File content of 'src/utils/helpers.ts':\n\nexport const ...`) or an error message if the file cannot be read (e.g., `Error: Could not read file 'src/protected.ts'.`).

*   **FileWrite**:
    *   **Description**: Writes content to a specified file. Can create a new file, overwrite an existing file, or append to an existing file.
    *   **Parameters**:
        *   `filePath`: string - The path to the file to be written (relative to the project root).
        *   `content`: string - The content to write to the file.
        *   `mode`: enum (`'overwrite'`, `'append'`, `'create_only'`) (optional, default: `'overwrite'`) -
            *   `'overwrite'`: Overwrites the file if it exists, creates it if it doesn't.
            *   `'append'`: Appends content to the end of the file if it exists, creates it if it doesn't.
            *   `'create_only'`: Creates the file only if it does not exist; fails if it exists.
    *   **Behavior**: Writes the provided content to the specified file according to the chosen mode. Creates parent directories if they don't exist.
    *   **Output**: A success message indicating the file was written (e.g., `Successfully wrote to 'docs/new-feature.md'.`) or an error message (e.g., `Error: File 'config.json' already exists (mode: create_only).`).

*   **Glob**:
    *   **Description**: Finds files and directories matching a specified glob pattern within the project. Useful for discovering files based on patterns.
    *   **Parameters**:
        *   `pattern`: string - The glob pattern to search for (e.g., `src/**/*.ts`, `*.md`).
        *   `cwd`: string (optional, default: project root) - The current working directory from which to apply the glob pattern.
        *   `ignore`: string[] (optional) - An array of glob patterns to ignore.
    *   **Behavior**: Searches the project directory (or specified `cwd`) for files and directories matching the glob pattern, respecting ignore patterns.
    *   **Output**: An array of file and directory paths matching the pattern. Example: `['src/index.ts', 'src/components/Button.tsx', 'src/utils/helpers.ts']`.

*   **Grep**:
    *   **Description**: Searches for content matching a regular expression pattern within files specified by a glob pattern. Returns matching lines and their context.
    *   **Parameters**:
        *   `filePattern`: string - A glob pattern specifying the files to search within (e.g., `src/**/*.tsx`, `*.py`).
        *   `searchTerm`: string - The regular expression to search for within the files.
        *   `contextLines`: number (optional, default: 0) - The number of lines of context to show before and after each matching line.
        *   `caseSensitive`: boolean (optional, default: `false`) - Whether the search should be case sensitive.
    *   **Behavior**: Scans files matching `filePattern` for lines that match `searchTerm`. For each match, it returns the file path, line number, the matching line, and optionally, surrounding context lines.
    *   **Output**: An array of objects, where each object represents a match and includes `filePath`, `lineNumber`, `lineContent`, and `context` (if `contextLines > 0`). Example: `[{ filePath: 'src/app.ts', lineNumber: 42, lineContent: 'const foo = "bar";', context: ['// some comment', 'const foo = "bar";', 'console.log(foo);'] }]` or `No matches found for pattern 'myRegex' in files matching 'src/**/*.js'.`.

*   **TaskList tools**:
    *   **Description**: A suite of tools for managing a task list. This allows the Agent to track its progress. The task list is persistent for the current agent session.
    *   **Sub-tools / Actions**:
        *   `prepare_tasks`:
            *   **Description**: Prepares or re-initializes the task list with a given set of task titles. Clears all existing tasks and creates new ones.
            *   **Parameters**:
                *   `titles`: string[] - An array of titles for the tasks to be created.
            *   **Output**: An array of the newly created task objects. Example: `[{ id: 'task_abc', title: 'New Task 1', completed: false }, { id: 'task_def', title: 'New Task 2', completed: false }]`.
        *   `get_tasks`:
            *   **Description**: Retrieves all current tasks from the task list.
            *   **Parameters**: None.
            *   **Output**: An array of task objects. Example: `[{ id: 'task_abc', title: 'New Task 1', completed: false }, { id: 'task_def', title: 'New Task 2', completed: true }]`.
        *   `update_task`:
            *   **Description**: Updates an existing task's title or completion status. Use 'completed: true' for completed tasks and 'completed: false' for pending tasks.
            *   **Parameters**:
                *   `taskId`: string - The ID of the task to update.
                *   `updates`: object - An object containing the updates. Can include `title: string` (optional) and `completed: boolean` (optional).
            *   **Output**: The updated task object, or an error if not found. Example: `{ id: 'task_def', title: 'New Task 2 (Updated)', completed: true }`.

*   **Bash**:
    *   **Description**: Executes a shell command within the project's root directory. This tool provides general shell access for the Agent. For safety, commands may be sandboxed or require user approval.
    *   **Parameters**:
        *   `command`: string - The shell command to execute (e.g., `ls -la`, `npm install`).
        *   `cwd`: string (optional, default: project root) - The working directory for the command.
        *   `timeout`: number (optional, default: 60000 ms) - Timeout for the command execution in milliseconds.
    *   **Behavior**: Executes the given shell command in a subprocess. Captures stdout, stderr, and the exit code.
    *   **Output**: An object containing `stdout`, `stderr`, and `exitCode`. Example: `{ stdout: 'file1.txt\nfile2.txt', stderr: '', exitCode: 0 }` or `{ stdout: '', stderr: 'Error: command not found', exitCode: 127 }`.

*   **Lint**:
    *   **Description**: Executes the project's configured linter (e.g., ESLint, Pylint) on specified files or the entire project. Returns any linting issues found. This might be a specialized version of the `Bash` tool or integrate directly with linter APIs if available.
    *   **Parameters**:
        *   `files`: string[] (optional) - An array of file paths to lint. If not provided, lints the entire project based on linter configuration.
        *   `linter`: string (optional) - Specify a linter to use (e.g., `'eslint'`, `'pylint'`). If not provided, attempts to auto-detect or use a configured default.
    *   **Behavior**: Runs the linter on the specified scope. Parses the linter output to identify issues.
    *   **Output**: An array of linting issues, each with `filePath`, `lineNumber`, `columnNumber`, `message`, and `severity`. Example: `[{ filePath: 'src/index.js', lineNumber: 10, columnNumber: 5, message: 'Missing semicolon', severity: 'error' }]` or `No linting issues found.`.

*   **Run Tests**:
    *   **Description**: Executes project tests using the configured test runner (e.g., Jest, Pytest). Can optionally run specific tests or test suites.
    *   **Parameters**:
        *   `testFiles`: string[] (optional) - An array of specific test files or patterns to run.
        *   `testNames`: string[] (optional) - An array of specific test names or describe block names to run.
        *   `runner`: string (optional) - Specify a test runner (e.g., `'jest'`, `'pytest'`). If not provided, attempts to auto-detect or use a configured default.
    *   **Behavior**: Invokes the test runner for the specified tests or the entire suite. Captures test results.
    *   **Output**: A summary of test results, including number of tests passed, failed, and skipped, along with details of any failures (e.g., error messages, stack traces). Example: `{ summary: '2 tests passed, 1 failed.', failures: [{ testName: 'should add two numbers', message: 'AssertionError: expected 2 to equal 3' }] }`.

*   **Semantic Search**:
    *   **Description**: Searches code within the project using semantic understanding, likely leveraging an embeddings-based approach (e.g., with the 'probe' library or similar). This allows for finding code based on meaning rather than exact keyword matches.
    *   **Parameters**:
        *   `query`: string - The natural language query describing the code or functionality to find.
        *   `fileTypes`: string[] (optional) - An array of file extensions to restrict the search to (e.g., `['.ts', '.py']`).
        *   `maxResults`: number (optional, default: 10) - The maximum number of search results to return.
    *   **Behavior**: Embeds the query and searches an indexed representation of the codebase (or a relevant subset) for semantically similar code snippets.
    *   **Output**: An array of search results, where each result includes `filePath`, `startLine`, `endLine`, `codeSnippet`, and a `similarityScore`. Example: `[{ filePath: 'src/services/auth.ts', startLine: 55, endLine: 65, codeSnippet: 'async function loginUser(...) {...}', similarityScore: 0.85 }]`.

## Relevant Files

The following files from the existing codebase are particularly relevant to the implementation and integration of these project tools:

*   **`src/mcp-server/aider-desk-mcp-server.ts`**: Provides a blueprint for how tools are defined, their schemas, and how they interact with an external API (AiderDesk). New project tools could follow a similar pattern if they need to interface with the Aider backend or other services.
*   **`resources/connector/connector.py`**: The Python backend (Aider) that processes commands and interacts with the file system and models. Understanding this layer is crucial for tools that need to execute Aider commands or leverage its capabilities (e.g., `run_prompt`, `add_context_file`).
*   **`src/renderer/src/components/settings/AgentSettings.tsx`**: Manages agent configurations, including `McpServerConfig` and `ToolApprovalState`. New tools, especially those exposed via MCP servers, would need to be configurable here, potentially with approval mechanisms.
*   **`src/renderer/src/components/PromptField.tsx`**: Handles user input and the invocation of commands (e.g., `/add`, `/run`, `/test`). Some project tools might be invokable via new slash commands or integrated into the agent's command processing logic.
*   **`src/common/types.ts`**: Contains essential type definitions such as `AgentConfig`, `McpServerConfig`, `ToolApprovalState`, `Mode`, and `EditFormat`. These types will be fundamental for integrating new tools into the agent's workflow and settings.
*   **`src/preload/index.ts`**: Defines the API bridge between the renderer and main Electron processes. If tools require direct interaction with main process functionalities (e.g., native dialogs, deeper file system access beyond Aider's scope), this bridge will be used.
*   **`src/renderer/src/components/project/ProjectView.tsx`**: Orchestrates the project interaction, including sending commands to the backend. New tools might influence how messages are displayed or how the project state is managed.
