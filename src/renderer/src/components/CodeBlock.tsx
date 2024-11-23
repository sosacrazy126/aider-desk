import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { VscCode } from 'react-icons/vsc';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type Props = {
  language: string;
  children: string;
  file?: string;
  isComplete?: boolean;
};

export const CodeBlock = ({ language, children, file, isComplete = true }: Props) => {
  const highlightedCode = Prism.highlight(children, Prism.languages[language] || Prism.languages.typescript, language || 'typescript');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-1">
      <div className="bg-gray-950 text-white rounded-md px-3 py-2 mb-4 overflow-x-auto text-xs">
        {file ? (
          <>
            <div className="text-neutral-100 text-xs py-1 w-full cursor-pointer flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
              <span className="flex items-center gap-2">
                <VscCode className="text-neutral-500" size={14} />
                {file}
              </span>
              <span className="flex items-center gap-2">
                {!isComplete && <AiOutlineLoading3Quarters className="animate-spin text-neutral-500" size={14} />}
                <span className="text-neutral-100 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  <MdKeyboardArrowDown size={16} />
                </span>
              </span>
            </div>
            <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <hr className="border-gray-700 my-2" />
              <pre>
                <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
            </div>
          </>
        ) : (
          <div className="relative">
            {!isComplete && (
              <div className="absolute right-0 top-1">
                <AiOutlineLoading3Quarters className="animate-spin text-neutral-500" size={14} />
              </div>
            )}
            <pre>
              <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
