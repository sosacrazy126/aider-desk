import { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { MdKeyboardArrowDown, MdUndo } from 'react-icons/md';
import { VscCode } from 'react-icons/vsc';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { IconButton } from '../common/IconButton';
import { CopyMessageButton } from './CopyMessageButton';

const DIFF_VIEWER_STYLES = {
  variables: {
    dark: {
      diffViewerBackground: 'var(--tw-gray-950)',
      diffViewerColor: '#FFF',
      addedBackground: '#022c22',
      addedColor: 'white',
      removedBackground: '#3f1d25',
      removedColor: 'white',
      wordAddedBackground: '#044536',
      wordRemovedBackground: '#601e29',
      addedGutterBackground: '#022c22',
      removedGutterBackground: '#3f1d25',
      gutterBackground: 'var(--tw-gray-950)',
      gutterBackgroundDark: 'var(--tw-gray-950)',
      highlightBackground: 'var(--tw-gray-800)',
      highlightGutterBackground: 'var(--tw-gray-800)',
      codeFoldGutterBackground: 'var(--tw-gray-950)',
      codeFoldBackground: 'var(--tw-gray-950)',
      emptyLineBackground: 'var(--tw-gray-950)',
      gutterColor: 'var(--tw-gray-500)',
      addedGutterColor: 'var(--tw-gray-600)',
      removedGutterColor: 'var(--tw-gray-600)',
      codeFoldContentColor: 'var(--tw-gray-600)',
      diffViewerTitleBackground: 'var(--tw-gray-950)',
      diffViewerTitleColor: 'var(--tw-gray-600)',
      diffViewerTitleBorderColor: 'var(--tw-gray-800)',
    },
  },
  contentText: {
    fontSize: 'var(--tw-text-xs)',
  },
  gutter: {
    fontSize: 'var(--tw-text-xs)',
    padding: '0',
    minWidth: '25px',
  },
  line: {
    padding: '0',
    lineHeight: '1rem',
  },
};

const SEARCH_MARKER = /^<{5,9} SEARCH[^\n]*$/m;
const DIVIDER_MARKER = /^={5,9}\s*$/m;
const REPLACE_MARKER = /^>{5,9} REPLACE\s*$/m;

const isDiffContent = (content: string): boolean => {
  return SEARCH_MARKER.test(content);
};

const parseDiffContent = (content: string): { oldValue: string; newValue: string } => {
  const searchMatch = content.match(SEARCH_MARKER);
  if (!searchMatch) {
    return { oldValue: '', newValue: '' };
  }

  const searchIndex = searchMatch.index! + searchMatch[0].length;
  const dividerMatch = content.match(DIVIDER_MARKER);
  const replaceMatch = content.match(REPLACE_MARKER);

  if (!dividerMatch) {
    const oldValue = content.substring(searchIndex).replace(/^\n/, '');
    return { oldValue, newValue: '' };
  }

  const dividerIndex = dividerMatch.index!;
  const oldValue = content.substring(searchIndex, dividerIndex).replace(/^\n/, '');

  if (!replaceMatch) {
    // We have old value complete and new value being streamed
    const newValue = content.substring(dividerIndex + dividerMatch[0].length).replace(/^\n/, '');
    return { oldValue, newValue };
  }

  // We have complete diff
  const updatedIndex = replaceMatch.index!;
  const newValue = content.substring(dividerIndex + dividerMatch[0].length, updatedIndex).replace(/^\n/, '');
  return { oldValue, newValue };
};

type Props = {
  baseDir: string;
  language: string;
  children: string;
  file?: string;
  isComplete?: boolean;
};

export const CodeBlock = ({ baseDir, language, children, file, isComplete = true }: Props) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [changesReverted, setChangesReverted] = useState(false);
  const isDiff = isDiffContent(children);
  const diffContent = isDiff ? parseDiffContent(children) : null;

  const highlightSyntax = (code: string) => {
    if (!code) {
      return <pre style={{ display: 'inline' }}></pre>;
    }

    try {
      const html = Prism.highlight(code, Prism.languages[language] || Prism.languages.typescript, language || 'typescript');
      return (
        <pre
          style={{ display: 'inline' }}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      );
    } catch (error) {
      console.error('Syntax highlighting failed:', error);
      return <pre style={{ display: 'inline' }}>{code}</pre>;
    }
  };

  const renderContent = () => {
    if (diffContent) {
      return (
        <ReactDiffViewer
          oldValue={diffContent.oldValue}
          newValue={diffContent.newValue}
          splitView={true}
          disableWordDiff={true}
          useDarkTheme={true}
          showDiffOnly={false}
          renderContent={isComplete ? highlightSyntax : undefined}
          styles={DIFF_VIEWER_STYLES}
        />
      );
    } else {
      const highlightedCode = Prism.highlight(children, Prism.languages[language] || Prism.languages.typescript, language || 'typescript');
      return (
        <pre>
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      );
    }
  };

  const handleRevertChanges = () => {
    window.api.applyEdits(baseDir, [
      {
        path: file!,
        original: diffContent?.newValue || '',
        updated: diffContent?.oldValue || '',
      },
    ]);
    setChangesReverted(true);
  };

  return (
    <div className="mt-1 overflow-x-auto max-w-full">
      <div className="bg-gray-950 text-white rounded-md px-3 py-2 mb-4 overflow-x-auto text-xs">
        {file ? (
          <>
            <div className="text-neutral-100 text-xs py-1 w-full cursor-pointer flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
              <span className="flex items-center gap-2">
                <VscCode className="text-neutral-500" size={14} />
                {file}
              </span>
              <span className="flex items-center gap-2">
                {isDiff && file && !!diffContent?.oldValue && !changesReverted && (
                  <div className="relative inline-block">
                    <IconButton icon={<MdUndo size={16} />} onClick={handleRevertChanges} tooltip="Revert changes" />
                  </div>
                )}
                <CopyMessageButton content={children} />
                {!isComplete && <AiOutlineLoading3Quarters className="animate-spin text-neutral-500" size={14} />}
                <span className="text-neutral-100 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <MdKeyboardArrowDown size={16} />
                </span>
              </span>
            </div>
            <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <hr className="border-gray-700 my-2" />
              {renderContent()}
            </div>
          </>
        ) : (
          <div className="relative">
            <div className="absolute right-0 top-1 flex items-center gap-2">
              <CopyMessageButton content={children} />
              {!isComplete && <AiOutlineLoading3Quarters className="animate-spin text-neutral-500" size={14} />}
            </div>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};
