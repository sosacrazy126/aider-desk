import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import { diffLines, formatLines } from 'unidiff';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/prism';

import 'react-diff-view/style/index.css';
import './DiffViewer.scss';

type Props = {
  oldValue: string;
  newValue: string;
  language: string;
};

function highlightLine(line: string, language: string) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vs2015}
      PreTag="span"
      customStyle={{
        background: 'none',
        display: 'block',
        margin: 0,
        padding: 0,
        fontSize: 'inherit',
        lineHeight: 'inherit',
        whiteSpace: 'pre-wrap',
      }}
      codeTagProps={{ style: { background: 'none', padding: 0 } }}
    >
      {line}
    </SyntaxHighlighter>
  );
}

export const DiffViewer = ({ oldValue, newValue, language }: Props) => {
  const { t } = useTranslation();

  const diffComputationResult = useMemo(() => {
    try {
      const diffText = formatLines(diffLines(oldValue, newValue), { context: 100 });
      const [parsedFile] = parseDiff(diffText, { nearbySequences: 'zip' });
      return { file: parsedFile, error: null };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      // eslint-disable-next-line no-console
      console.error('Error generating diff:', error);
      return { file: undefined, error: error };
    }
  }, [oldValue, newValue]);

  const { file: diffFile, error: diffError } = diffComputationResult;

  if (diffError) {
    return (
      <div className="flex w-full flex-col">
        <div className="flex w-full">
          <div className="flex-1 overflow-auto px-4 py-3 border-r border-neutral-850">
            <h3 className="mt-0 mb-2 text-xs font-semibold text-neutral-200">Old Value</h3>
            <SyntaxHighlighter
              language={language}
              style={vs2015}
              customStyle={{
                background: '#23272e',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.80em',
                lineHeight: '1.45',
                margin: 0,
              }}
              showLineNumbers={false}
            >
              {oldValue}
            </SyntaxHighlighter>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3">
            <h3 className="mt-0 mb-2 text-xs font-semibold text-neutral-200">New Value</h3>
            <SyntaxHighlighter
              language={language}
              style={vs2015}
              customStyle={{
                background: '#23272e',
                borderRadius: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.80em',
                lineHeight: '1.45',
                margin: 0,
              }}
              showLineNumbers={false}
            >
              {newValue}
            </SyntaxHighlighter>
          </div>
        </div>
        {diffError.message && (
          <div className="w-full px-4 py-2 bg-red-900/50 text-red-300  text-xs text-center">
            Error: {diffError.message}
            <br />
            Please report an issue in https://github.com/hotovo/aider-desk/issues.
          </div>
        )}
      </div>
    );
  }

  if (!diffFile || !diffFile.hunks || diffFile.hunks.length === 0) {
    // No error, but no diff file (e.g., identical content)
    return <div className="flex w-full justify-center items-center py-4 text-neutral-400 text-xs">{t('diffViewer.noChanges')}</div>;
  }

  // Custom render tokens for syntax highlighting
  return (
    <Diff
      viewType="split"
      diffType={diffFile.type}
      hunks={diffFile.hunks}
      className="diff-viewer"
      optimizeSelection={true}
      // Remove tokens prop, and instead use custom render function per line
    >
      {hunks =>
        hunks.map(hunk => (
          <Hunk
            key={hunk.content}
            hunk={{
              ...hunk,
              // Highlight each line content with syntax highlighter
              changes: hunk.changes.map(change => ({
                ...change,
                highlightedContent: highlightLine(change.content || '', language),
              })),
            }}
            // Custom render for the content, using highlightedContent instead of raw content
            // The following override works if Hunk supports a custom content renderer
            // Otherwise, you may need to patch the internal rendering
            // If Hunk does not support this, you may need to fork or reimplement row rendering
            // Here, we rely on our highlightedContent
            renderToken={(_token, { change }) =>
              change.highlightedContent || change.content
            }
          />
        ))
      }
    </Diff>
  );
};
