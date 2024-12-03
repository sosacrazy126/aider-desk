import {
  AutocompletionData,
  ModelsData,
  ProjectData,
  ResponseChunkData,
  ResponseCompletedData,
  ErrorData,
  WarningData,
  CommandOutputData,
} from '@common/types';
import { AddFileDialog } from 'components/AddFileDialog';
import { ContextFiles } from 'components/ContextFiles';
import { Messages } from 'components/Messages';
import { PromptField, PromptFieldRef } from 'components/PromptField';
import { IpcRendererEvent } from 'electron';
import { useEffect, useRef, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import {
  LoadingMessage,
  Message,
  ModelsMessage,
  PromptMessage,
  ErrorMessage,
  ResponseMessage,
  WarningMessage,
  CommandOutputMessage,
  isCommandOutputMessage,
} from 'types/message';
import { v4 as uuidv4 } from 'uuid';
import { CgSpinner } from 'react-icons/cg';

type AddFileDialogOptions = {
  readOnly: boolean;
};

type Props = {
  project: ProjectData;
  isActive?: boolean;
};

export const ProjectView = ({ project, isActive = false }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [processing, setProcessing] = useState(false);
  const [addFileDialogOptions, setAddFileDialogOptions] = useState<AddFileDialogOptions | null>(null);
  const [autocompletionData, setAutocompletionData] = useState<AutocompletionData | null>(null);
  const [currentModels, setCurrentModels] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const processingMessageRef = useRef<ResponseMessage | null>(null);
  const promptFieldRef = useRef<PromptFieldRef>(null);

  useEffect(() => {
    window.api.startProject(project.baseDir);

    return () => {
      window.api.stopProject(project.baseDir);
    };
  }, [project.baseDir]);

  useEffect(() => {
    if (messages.length > 0) {
      setLoading(false);
    }
  }, [messages]);

  useEffect(() => {
    const handleResponseChunk = (_: IpcRendererEvent, { messageId, chunk, reflectedMessage }: ResponseChunkData) => {
      const processingMessage = processingMessageRef.current;
      if (!processingMessage || processingMessage.id !== messageId) {
        const newMessages: Message[] = [];

        if (reflectedMessage) {
          newMessages.push({
            id: uuidv4(),
            type: 'reflected-message',
            content: reflectedMessage,
          });
        }

        const newResponseMessage: ResponseMessage = {
          id: messageId,
          type: 'response',
          content: chunk,
          processing: true,
        };
        processingMessageRef.current = newResponseMessage;
        newMessages.push(newResponseMessage);
        setMessages((prevMessages) => prevMessages.filter((message) => message.type !== 'loading').concat(...newMessages));
      } else {
        processingMessage.content += chunk;
        setMessages((prevMessages) => prevMessages.map((message) => (message.id === messageId ? processingMessage : message)));
      }
    };

    const handleResponseCompleted = (_: IpcRendererEvent, { messageId }: ResponseCompletedData) => {
      const processingMessage = processingMessageRef.current;
      if (processingMessage && processingMessage.id === messageId) {
        processingMessage.processing = false;
        setMessages((prevMessages) => prevMessages.map((message) => (message.id === messageId ? processingMessage : message)));
        setProcessing(false);
        processingMessageRef.current = null;
      } else if (!processingMessage && processing) {
        setMessages((prevMessages) => prevMessages.filter((message) => message.type !== 'loading'));
        setProcessing(false);
      }
    };

    const handleCommandOutput = (_: IpcRendererEvent, { command, output }: CommandOutputData) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];

        if (isCommandOutputMessage(lastMessage) && lastMessage.command === command) {
          const updatedLastMessage: CommandOutputMessage = {
            ...lastMessage,
            content: lastMessage.content + output,
          };
          return prevMessages.slice(0, -1).concat(updatedLastMessage);
        } else {
          const commandOutputMessage: CommandOutputMessage = {
            id: uuidv4(),
            type: 'command-output',
            command,
            content: output,
          };
          return prevMessages.filter((message) => message.type !== 'loading').concat(commandOutputMessage);
        }
      });
    };

    const handleWarning = (_: IpcRendererEvent, { warning }: WarningData) => {
      const warningMessage: WarningMessage = {
        id: uuidv4(),
        type: 'warning',
        content: warning,
      };
      setMessages((prevMessages) => prevMessages.filter((message) => message.type !== 'loading').concat(warningMessage));
      setProcessing(false);
    };

    const handleError = (_: IpcRendererEvent, { error }: ErrorData) => {
      const errorMessage: ErrorMessage = {
        id: uuidv4(),
        type: 'error',
        content: error,
      };
      setMessages((prevMessages) => prevMessages.filter((message) => message.type !== 'loading').concat(errorMessage));
      setProcessing(false);
    };

    const autocompletionListenerId = window.api.addUpdateAutocompletionListener(project.baseDir, (_, data) => {
      setAutocompletionData(data);
    });

    const currentModelsListenerId = window.api.addSetCurrentModelsListener(project.baseDir, (_, data) => {
      setCurrentModels(data);

      if (data.error) {
        const errorMessage: ErrorMessage = {
          id: uuidv4(),
          type: 'error',
          content: data.error,
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } else {
        const modelsMessage: ModelsMessage = {
          id: uuidv4(),
          type: 'models',
          content: '',
          models: data,
        };
        setMessages((prevMessages) => [...prevMessages, modelsMessage]);
      }
    });

    const commandOutputListenerId = window.api.addCommandOutputListener(project.baseDir, handleCommandOutput);
    const responseChunkListenerId = window.api.addResponseChunkListener(project.baseDir, handleResponseChunk);
    const responseCompletedListenerId = window.api.addResponseCompletedListener(project.baseDir, handleResponseCompleted);
    const warningListenerId = window.api.addWarningListener(project.baseDir, handleWarning);
    const errorListenerId = window.api.addErrorListener(project.baseDir, handleError);

    return () => {
      window.api.removeUpdateAutocompletionListener(autocompletionListenerId);
      window.api.removeSetCurrentModelsListener(currentModelsListenerId);
      window.api.removeCommandOutputListener(commandOutputListenerId);
      window.api.removeResponseChunkListener(responseChunkListenerId);
      window.api.removeResponseCompletedListener(responseCompletedListenerId);
      window.api.removeWarningListener(warningListenerId);
      window.api.removeErrorListener(errorListenerId);
    };
  }, [project.baseDir, processing]);

  const handleAddFile = (filePath: string, readOnly = false) => {
    window.api.addFile(project.baseDir, filePath, readOnly);
    setAddFileDialogOptions(null);
    promptFieldRef.current?.focus();
  };

  const handlePromptSubmit = (prompt: string, editFormat?: string) => {
    setProcessing(true);
    const promptMessage: PromptMessage = {
      id: uuidv4(),
      type: 'prompt',
      editFormat,
      content: prompt,
    };
    const loadingMessage: LoadingMessage = {
      id: uuidv4(),
      type: 'loading',
      content: 'Thinking...',
    };
    setMessages((prevMessages) => [...prevMessages, promptMessage, loadingMessage]);
  };

  const showFileDialog = (readOnly: boolean) => {
    setAddFileDialogOptions({
      readOnly,
    });
  };

  return (
    <div className="flex h-full bg-neutral-900 relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 z-10">
          <CgSpinner className="animate-spin w-10 h-10" />
          <div className="mt-2 text-sm text-center text-white">Loading...</div>
        </div>
      )}
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow overflow-y-auto">
          <Messages messages={messages} allFiles={autocompletionData?.allFiles} />
        </div>
        <div className="relative bottom-0 w-full p-4 pb-2 flex-shrink-0 flex max-h-[50vh] border-t border-neutral-800">
          <PromptField
            ref={promptFieldRef}
            baseDir={project.baseDir}
            onSubmitted={handlePromptSubmit}
            processing={processing}
            isActive={isActive}
            words={autocompletionData?.words}
            models={autocompletionData?.models}
            currentModel={currentModels?.name}
            showFileDialog={showFileDialog}
          />
        </div>
      </div>
      <ResizableBox
        width={300}
        height={Infinity}
        minConstraints={[100, Infinity]}
        maxConstraints={[window.innerWidth - 300, Infinity]}
        axis="x"
        resizeHandles={['w']}
        className="border-l border-neutral-800 flex flex-col flex-shrink-0"
      >
        <ContextFiles
          baseDir={project.baseDir}
          showFileDialog={() =>
            setAddFileDialogOptions({
              readOnly: false,
            })
          }
        />
      </ResizableBox>
      {addFileDialogOptions && (
        <AddFileDialog
          baseDir={project.baseDir}
          onClose={() => {
            setAddFileDialogOptions(null);
            promptFieldRef.current?.focus();
          }}
          onAddFile={handleAddFile}
          initialReadOnly={addFileDialogOptions.readOnly}
        />
      )}
    </div>
  );
};
