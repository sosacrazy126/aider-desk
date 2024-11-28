import { AutocompletionData, ModelsData, ProjectData, ResponseChunkData, ResponseCompletedData, ResponseErrorData } from '@common/types';
import { AddFileDialog } from 'components/AddFileDialog';
import { ContextFiles } from 'components/ContextFiles';
import { Messages } from 'components/Messages';
import { PromptField, PromptFieldRef } from 'components/PromptField';
import { IpcRendererEvent } from 'electron';
import { useEffect, useRef, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { LoadingMessage, Message, ModelsMessage, PromptMessage, ResponseErrorMessage, ResponseMessage } from 'types/message';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  project: ProjectData;
  isActive?: boolean;
};

export const ProjectView = ({ project, isActive = false }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [processing, setProcessing] = useState(false);
  const [addFileDialogVisible, setAddFileDialogVisible] = useState(false);
  const [autocompletionData, setAutocompletionData] = useState<AutocompletionData | null>(null);
  const [currentModels, setCurrentModels] = useState<ModelsData | null>(null);
  const processingMessageRef = useRef<ResponseMessage | null>(null);
  const promptFieldRef = useRef<PromptFieldRef>(null);

  useEffect(() => {
    window.api.startProject(project.baseDir);

    return () => {
      window.api.stopProject(project.baseDir);
    };
  }, [project.baseDir]);

  useEffect(() => {
    const handleResponseChunk = (_: IpcRendererEvent, { messageId, chunk }: ResponseChunkData) => {
      const processingMessage = processingMessageRef.current;
      if (!processingMessage || processingMessage.id !== messageId) {
        const newResponseMessage: ResponseMessage = {
          type: 'response',
          id: messageId,
          content: chunk,
          processing: true,
        };
        processingMessageRef.current = newResponseMessage;
        setMessages((prevMessages) => prevMessages.filter((message) => message.type !== 'loading').concat(newResponseMessage));
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

    const handleResponseError = (_: IpcRendererEvent, { error }: ResponseErrorData) => {
      const errorMessage: ResponseErrorMessage = {
        id: uuidv4(),
        type: 'response-error',
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
        const errorMessage: ResponseErrorMessage = {
          id: uuidv4(),
          type: 'response-error',
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

    const responseChunkListenerId = window.api.addResponseChunkListener(project.baseDir, handleResponseChunk);
    const responseCompletedListenerId = window.api.addResponseCompletedListener(project.baseDir, handleResponseCompleted);
    const responseErrorListenerId = window.api.addResponseErrorListener(project.baseDir, handleResponseError);

    return () => {
      window.api.removeUpdateAutocompletionListener(autocompletionListenerId);
      window.api.removeSetCurrentModelsListener(currentModelsListenerId);
      window.api.removeResponseChunkListener(responseChunkListenerId);
      window.api.removeResponseCompletedListener(responseCompletedListenerId);
      window.api.removeResponseErrorListener(responseErrorListenerId);
    };
  }, [project.baseDir, processing]);

  const handleAddFile = (filePath: string) => {
    window.api.addFile(project.baseDir, filePath);
    setAddFileDialogVisible(false);
    promptFieldRef.current?.focus();
  };

  const handlePromptSubmit = (prompt: string, editFormat?: string) => {
    setProcessing(true);
    const promptMessage: PromptMessage = {
      id: uuidv4(),
      type: 'prompt',
      content: `${editFormat ? `${editFormat}` : ''}> ${prompt}`,
    };
    const loadingMessage: LoadingMessage = {
      id: uuidv4(),
      type: 'loading',
      content: 'Thinking...',
    };
    setMessages((prevMessages) => [...prevMessages, promptMessage, loadingMessage]);
  };

  return (
    <div className="flex h-full bg-neutral-900">
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
            showFileDialog={() => setAddFileDialogVisible(true)}
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
        <ContextFiles baseDir={project.baseDir} showFileDialog={() => setAddFileDialogVisible(true)} />
      </ResizableBox>
      {addFileDialogVisible && (
        <AddFileDialog
          baseDir={project.baseDir}
          onClose={() => {
            setAddFileDialogVisible(false);
            promptFieldRef.current?.focus();
          }}
          onAddFile={handleAddFile}
        />
      )}
    </div>
  );
};
