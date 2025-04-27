import { tool } from 'ai';
import { z } from 'zod';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';
import { QuestionData } from '@common/types';

import { Project } from '../../project';

import type { ToolSet } from 'ai';

export const createAiderToolset = (project: Project): ToolSet => {
  const getContextFilesTool = tool({
    description: 'Get all files currently in the context for Aider to read or edit',
    parameters: z.object({
      projectDir: z.string().describe("The project directory. Can be '.' for current project."),
    }),
    execute: async () => {
      const files = project.getContextFiles();
      return JSON.stringify(files);
    },
  });

  const addContextFileTool = tool({
    description: 'Add a file to the context of Aider',
    parameters: z.object({
      path: z.string().describe('File path to add to context. Relative to project directory when not read-only. Absolute path should be used when read-only.'),
      readOnly: z.boolean().optional().describe('Whether the file is read-only'),
    }),
    execute: async ({ path, readOnly }) => {
      await project.addFile({
        path: path,
        readOnly: readOnly || false,
      });
      return `Added file: ${path}`;
    },
  });

  const dropContextFileTool = tool({
    description: 'Remove a file from the context of Aider',
    parameters: z.object({
      path: z.string().describe('File path to remove from context.'),
    }),
    execute: async ({ path }) => {
      project.dropFile(path);
      return `Dropped file: ${path}`;
    },
  });

  const runPromptTool = tool({
    description: `Give a prompt to the coding assistant Aider to perform coding tasks. This should be used whenever request from seems to be a coding task. If user's request seems to be a coding task, use this tool. You can give aider some steps to perform based on the user's request, but since Aider is very efficient in coding tasks, you do not need to handhold it. Before running this tool, make sure all the necessary files related to user's request are added to the Aider's context.
- **Rules:**
    - Writing, modifying, refactoring, or explaining code.
    - Debugging, improving performance, and implementing new features.
    - \`aider\` knows content of all the files you see in your context.
    - \`aider\` should be prompted in natural language and the instructions should be clear and complete.
    - before run_prompt tool, make sure all the necessary files are added to the it's context using add_context_file tool.
    - treat \`aider\` as Medior Level programmer, ready to fulfill your requests.
    - ALWAYS prefer this tool before other available tools for when creating, updating files and coding tasks.
    - 'updatedFiles' will be a list of files that were updated by the tool as mentioned in 'responses'.
- **Restrictions:**
    - **Do NOT mention specific programming languages** (e.g., Python, JavaScript, Java, C++).
    - **Do NOT reference language-specific features, syntax, or libraries** in natural language prompts.
    - If \`aider\` is used, ensure instructions are **complete, clear, and standalone**.
`,
    parameters: z.object({
      prompt: z.string().describe('The prompt to run in natural language.'),
    }),
    execute: async ({ prompt }, { toolCallId }) => {
      project.addToolMessage(toolCallId, 'aider', 'run_prompt', { prompt });

      const questionData: QuestionData = {
        baseDir: project.baseDir,
        text: 'Approve prompt to run in Aider?',
        subject: prompt,
        defaultAnswer: 'y',
        key: `aider${SERVER_TOOL_SEPARATOR}run_prompt`,
      };

      // Ask the question and wait for the answer
      const [yesNoAnswer, userInput] = await project.askQuestion(questionData);

      const isApproved = yesNoAnswer === 'y';

      if (!isApproved) {
        return {
          responses: [],
          updatedFiles: [],
          error: `Aider prompt execution denied by user.${userInput ? ` User input: ${userInput}` : ''}`,
        };
      }

      const responses = await project.sendPrompt(prompt, 'code', true);

      // Notify that we are still processing after aider finishes
      project.addLogMessage('loading');

      return {
        responses: responses.map((response) => ({
          messageId: response.messageId,
          content: response.content.trim(),
          reflectedMessage: response.reflectedMessage,
        })),
        updatedFiles: responses.flatMap((response) => response.editedFiles || []).filter((value, index, self) => self.indexOf(value) === index), // Unique files
      };
    },
  });

  return {
    [`aider${SERVER_TOOL_SEPARATOR}get_context_files`]: getContextFilesTool,
    [`aider${SERVER_TOOL_SEPARATOR}add_context_file`]: addContextFileTool,
    [`aider${SERVER_TOOL_SEPARATOR}drop_context_file`]: dropContextFileTool,
    [`aider${SERVER_TOOL_SEPARATOR}run_prompt`]: runPromptTool,
  };
};
