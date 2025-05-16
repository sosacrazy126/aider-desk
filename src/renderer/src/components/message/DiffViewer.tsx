import Prism from 'prismjs';
import ReactDiffViewer from 'react-diff-viewer-continued';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

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
  content: {
    width: '50%',
    padding: '0',
    userSelect: 'none',

    '&:nth-child(6)': {
      userSelect: 'text',
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

const highlightSyntax = (code: string, language: string) => {
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
    // eslint-disable-next-line no-console
    console.error('Syntax highlighting failed:', error);
    return <pre style={{ display: 'inline' }}>{code}</pre>;
  }
};

type Props = {
  oldValue: string;
  newValue: string;
  isComplete?: boolean;
  language: string;
};

export const DiffViewer = ({ oldValue, newValue, isComplete = true, language }: Props) => {
  return (
    <ReactDiffViewer
      oldValue={oldValue}
      newValue={newValue}
      splitView={true}
      disableWordDiff={true}
      useDarkTheme={true}
      showDiffOnly={false}
      renderContent={isComplete ? (code) => highlightSyntax(code, language) : undefined}
      styles={DIFF_VIEWER_STYLES}
    />
  );
};
