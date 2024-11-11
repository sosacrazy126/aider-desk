import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

type Props = {
  language: string;
  children: string;
};

export const CodeBlock = ({ language, children }: Props) => {
  const highlightedCode = Prism.highlight(children, Prism.languages[language] || Prism.languages.typescript, language || 'typescript');

  return (
    <pre className="bg-gray-950 text-white rounded-md px-3 py-2 mb-4 overflow-x-auto text-xs">
      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
};
