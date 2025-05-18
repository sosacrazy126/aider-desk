import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardArrowUp } from 'react-icons/md';
import { EditFormat, isValidEditFormat } from '@common/types';
import { toast } from 'react-hot-toast';

import { useClickOutside } from '@/hooks/useClickOutside';
import { useBooleanState } from '@/hooks/useBooleanState';

export type EditFormatSelectorRef = {
  open: () => void;
};

// Define available edit formats based on the EditFormat type
const SUPPORTED: EditFormat[] = ['diff', 'diff-fenced', 'whole', 'udiff', 'udiff-simple', 'patch'];
const editFormatOptions = SUPPORTED;

type Props = {
  currentFormat: EditFormat;
  onFormatChange: (format: EditFormat) => void;
};

export const EditFormatSelector = forwardRef<EditFormatSelectorRef, Props>(({ currentFormat, onFormatChange }, ref) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [visible, show, hide] = useBooleanState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const highlightedItemRef = useRef<HTMLDivElement>(null);

  useClickOutside(selectorRef, hide);

  useEffect(() => {
    if (!visible) {
      setHighlightedIndex(-1);
      setSearchTerm('');
    }
  }, [visible]);

  useImperativeHandle(ref, () => ({
    open: show,
  }));

  const toggleVisible = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, hide, show]);

  const handleChange = (fmt: string) => {
    if (!SUPPORTED.includes(fmt as EditFormat)) {
      console.warn('[EditFormatSelector] invalid format', fmt);
      toast.error(t('invalidEditFormat'));
      return;
    }
    onFormatChange(fmt as EditFormat);
    hide();
  };

  // For backwards compatibility:
  const handleFormatSelected = handleChange;

  const filteredFormats = editFormatOptions.filter((format) => format.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderFormatItem = (format: EditFormat, index: number) => (
    <div
      key={format}
      ref={index === highlightedIndex ? highlightedItemRef : undefined}
      className={`flex items-center w-full hover:bg-neutral-700 transition-colors duration-200 ${index === highlightedIndex ? 'bg-neutral-700' : 'text-neutral-300'}`}
    >
      <button
        onClick={() => handleFormatSelected(format)}
        className={`flex-grow px-3 py-1 text-left text-xs ${format === currentFormat ? 'text-white font-bold' : ''}`}
      >
        {format}
      </button>
    </div>
  );

  return (
    <div className="relative" ref={selectorRef}>
      <button onClick={toggleVisible} className="flex items-center hover:text-neutral-300 focus:outline-none transition-colors duration-200 text-xs">
        <span>{currentFormat || t('common.loading')}</span>
        <MdKeyboardArrowUp className="w-3 h-3 ml-1 transform rotate-180" />
      </button>
      {visible && (
        <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10 flex flex-col w-60">
          <div className="overflow-y-auto scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600 max-h-48">
            {filteredFormats.map(renderFormatItem)}
          </div>
        </div>
      )}
    </div>
  );
});

EditFormatSelector.displayName = 'EditFormatSelector';
