import { useEffect, useState, useRef } from 'react';
import { IpcRendererEvent } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { Messages } from 'components/Messages';
import { PromptField } from 'components/PromptField';
import { ContextFiles } from 'components/ContextFiles';
import { ResponseChunkData, ResponseCompletedData } from '@common/types';
import { LoadingMessage, Message, PromptMessage, ResponseMessage } from 'types/message';

type Props = {
  baseDir: string;
};

export const ProjectPanel = ({ baseDir }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [processing, setProcessing] = useState(false);
  const processingMessageRef = useRef<ResponseMessage | null>(null);

  useEffect(() => {
    window.api.startProject(baseDir);

    return () => {
      window.api.stopProject(baseDir);
    };
  }, [baseDir]);

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
      }
    };

    const responseChunkListenerId = window.api.addResponseChunkListener(baseDir, handleResponseChunk);
    const responseCompletedListenerId = window.api.addResponseCompletedListener(baseDir, handleResponseCompleted);

    return () => {
      window.api.removeResponseChunkListener(responseChunkListenerId);
      window.api.removeResponseCompletedListener(responseCompletedListenerId);
    };
  }, [baseDir]);

  const handlePromptSubmit = (prompt: string) => {
    setProcessing(true);
    const promptMessage: PromptMessage = {
      id: uuidv4(),
      type: 'prompt',
      content: `> ${prompt}`,
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
          <Messages messages={messages} />
        </div>
        <div
          className="relative bottom-0 w-full p-4 pt-3 flex-shrink-0 flex max-h-[50vh]
          before:content-['']
          before:absolute
          before:left-0
          before:right-0
          before:top-[-12px]
          before:h-[12px]
          before:bg-gradient-to-t
          before:from-neutral-900
          before:to-transparent
          before:pointer-events-none"
        >
          <PromptField baseDir={baseDir} onSubmit={handlePromptSubmit} processing={processing} />
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
        <ContextFiles baseDir={baseDir} />
      </ResizableBox>
    </div>
  );
};
