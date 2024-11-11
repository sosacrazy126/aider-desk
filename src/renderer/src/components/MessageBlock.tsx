import React from 'react';
import { isLoadingMessage, Message } from 'types/message';
import { CodeInline } from './CodeInline';
import { CodeBlock } from './CodeBlock';

type Props = {
  message: Message;
};

export const MessageBlock = ({ message }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full break-words whitespace-pre-wrap text-xs bg-gray-900 text-white';

  if (isLoadingMessage(message)) {
    return <div className={`${baseClasses} text-neutral-500 animate-pulse`}>{message.content}</div>;
  }

  const parseContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    let currentText = '';
    let isInTripleTick = false;
    let isInSingleTick = false;
    let language = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '`') {
        // Look ahead for triple ticks
        if (!isInTripleTick && !isInSingleTick && i + 2 < content.length && content[i + 1] === '`' && content[i + 2] === '`') {
          if (currentText) {
            parts.push(currentText);
          }
          currentText = '';
          isInTripleTick = true;
          i += 2; // Skip the next two backticks

          // Extract language if present
          let j = i + 1;
          while (j < content.length && /[a-zA-Z]/.test(content[j])) {
            language += content[j];
            j++;
          }
          i = j - 1;
        }
        // Close triple tick block
        else if (isInTripleTick && i + 2 < content.length && content[i + 1] === '`' && content[i + 2] === '`') {
          parts.push(
            <CodeBlock key={parts.length} language={language}>
              {currentText.trim()}
            </CodeBlock>,
          );
          currentText = '';
          isInTripleTick = false;
          language = '';
          i += 2; // Skip the next two backticks
        }
        // Single tick handling outside triple tick
        else if (!isInTripleTick && !isInSingleTick) {
          if (currentText) {
            parts.push(currentText);
          }
          currentText = '';
          isInSingleTick = true;
        }
        // Close single tick block
        else if (isInSingleTick) {
          parts.push(<CodeInline key={parts.length}>{currentText}</CodeInline>);
          currentText = '';
          isInSingleTick = false;
        }
        // If inside triple tick, treat as regular character
        else if (isInTripleTick) {
          currentText += char;
        }
      } else {
        currentText += char;
      }
    }

    // Handle any remaining text
    if (isInTripleTick) {
      parts.push(
        <CodeBlock key={parts.length} language={language}>
          {currentText.trim()}
        </CodeBlock>,
      );
    } else if (isInSingleTick) {
      parts.push(<CodeInline key={parts.length}>{currentText}</CodeInline>);
    } else if (currentText) {
      parts.push(currentText.trim());
    }

    return parts;
  };

  return <div className={`${baseClasses}`}>{parseContent(message.content)}</div>;
};
