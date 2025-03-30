import { StructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { EditFormat } from '@common/types';

import { Project } from '../../project';

export const createAiderTools = (project: Project, editFormat: EditFormat = 'code'): StructuredTool[] => {
  const getContextFilesTool = tool(
    async () => {
      const files = project.getContextFiles();
      return JSON.stringify(files);
    },
    {
      name: 'aider-get_context_files',
      description: 'Get all files currently in the context for Aider to use',
      schema: z.object({
        projectDir: z.string().describe("The project directory. Can be '.' for current project."),
      }),
    },
  );

  const addContextFileTool = tool(
    async (params: { path: string; readOnly?: boolean }) => {
      await project.addFile({
        path: params.path,
        readOnly: params.readOnly || false,
      });

      return `Added file: ${params.path}`;
    },
    {
      name: 'aider-add_context_file',
      description: 'Add a file to the context of Aider',
      schema: z.object({
        path: z.string().describe('File path to add to context'),
        readOnly: z.boolean().describe('Whether the file is read-only'),
      }),
    },
  );

  const dropContextFileTool = tool(
    async (params: { path: string }) => {
      project.dropFile(params.path);

      return `Dropped file: ${params.path}`;
    },
    {
      name: 'aider-drop_context_file',
      description: 'Remove a file from the context of Aider',
      schema: z.object({
        path: z.string().describe('File path to remove from context'),
      }),
    },
  );

  const runPromptTool = tool(
    async (params: { prompt: string; editFormat?: EditFormat }) => {
      const responses = await project.sendPrompt(params.prompt, editFormat);

      // Merge all responses into a single cohesive response
      const mergedResponse = responses
        .map((response) => response.content.trim())
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n'); // Normalize excessive newlines

      const editedFiles = responses.flatMap((response) => response.editedFiles || []).filter((value, index, self) => self.indexOf(value) === index); // Unique files

      return `${mergedResponse}\n\nUsing the above information I have updated the following files: ${editedFiles.join(', ')}`;
    },
    {
      name: 'aider-run_prompt',
      description:
        'Run a prompt in Aider to perform coding tasks. Before running this tool, make sure all the necessary files are added to the context, if possible.',
      schema: z.object({
        prompt: z.string().describe('The prompt to run'),
      }),
    },
  );

  return [getContextFilesTool, addContextFileTool, dropContextFileTool, runPromptTool];
};
