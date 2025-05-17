import { useMemo } from 'react';
import { Diff, Hunk, parseDiff, tokenize } from 'react-diff-view';
import { diffLines, formatLines } from 'unidiff';
import refractor from 'refractor';

import 'react-diff-view/style/index.css';
import './DiffViewer.scss';

const createTokens = (hunks, language: string) => {
  if (!hunks) {
    return undefined;
  }

  const options = {
    highlight: true,
    refractor,
    language,
  };

  try {
    return tokenize(hunks, options);
  } catch {
    return undefined;
  }
};

type Props = {
  oldValue: string;
  newValue: string;
  language: string;
};

export const DiffViewer = ({ oldValue, newValue, language }: Props) => {
  const diff = useMemo(() => {
    const diffText = formatLines(diffLines(oldValue, newValue), { context: 100 });
    const [diff] = parseDiff(diffText, { nearbySequences: 'zip' });

    return diff;
  }, [oldValue, newValue]);
  const tokens = useMemo(() => createTokens(diff.hunks, language), [diff.hunks, language]);

  if (!diff) {
    return null;
  }

  return (
    <Diff viewType="split" diffType={diff.type} hunks={diff.hunks} className="diff-viewer" optimizeSelection={true} tokens={tokens}>
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  );
};
