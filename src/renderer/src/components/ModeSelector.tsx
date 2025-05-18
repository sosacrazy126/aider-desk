import { ElementType, useRef, useState } from 'react';
import { CgTerminal } from 'react-icons/cg';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { AiOutlineFileSearch } from 'react-icons/ai';
import { RiRobot2Line } from 'react-icons/ri';
import { GoProjectRoadmap } from 'react-icons/go';
import { BsBug } from 'react-icons/bs';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { Mode } from '@common/types';
import { useTranslation } from 'react-i18next';

import { AgentSelector } from './McpSelector';

import { useClickOutside } from '@/hooks/useClickOutside';

type ModeConfig = {
  icon: ElementType;
  labelKey: string;
  tooltipKey: string;
};

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  code: {
    icon: CgTerminal,
    labelKey: 'mode.code',
    tooltipKey: 'modeTooltip.code',
  },
  agent: {
    icon: RiRobot2Line,
    labelKey: 'mode.agent',
    tooltipKey: 'modeTooltip.agent',
  },
  ask: {
    icon: FaRegQuestionCircle,
    labelKey: 'mode.ask',
    tooltipKey: 'modeTooltip.ask',
  },
  architect: {
    icon: GoProjectRoadmap,
    labelKey: 'mode.architect',
    tooltipKey: 'modeTooltip.architect',
  },
  context: {
    icon: AiOutlineFileSearch,
    labelKey: 'mode.context',
    tooltipKey: 'modeTooltip.context',
  },
  debug: {
    icon: BsBug,
    labelKey: 'mode.debug',
    tooltipKey: 'modeTooltip.debug',
  },
};

const MODES_ORDER: Mode[] = ['code', 'agent', 'ask', 'architect', 'context', 'debug'];

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

export const ModeSelector = ({ mode, onModeChange }: Props) => {
  const { t } = useTranslation();
  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  useClickOutside(modeSelectorRef, () => setModeSelectorVisible(false));

  const toggleModeSelectorVisible = () => setModeSelectorVisible((prev) => !prev);

  const handleModeChange = (newMode: Mode) => {
    onModeChange(newMode);
    setModeSelectorVisible(false);
  };

  const { icon: CurrentModeIcon, labelKey: currentModeLabelKey } = MODE_CONFIG[mode];

  return (
    <div className="relative flex items-center gap-1.5" ref={modeSelectorRef}>
      <button
        onClick={toggleModeSelectorVisible}
        className="flex items-center gap-1 px-2 py-1 bg-neutral-850 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 focus:outline-none transition-colors duration-200 text-xs border-neutral-600 border rounded-md"
      >
        <CurrentModeIcon className="w-4 h-4" />
        <span className="mb-[-2px] ml-1 text-xxs">{t(currentModeLabelKey)}</span>
        {modeSelectorVisible ? <MdKeyboardArrowUp className="w-4 h-4 ml-0.5" /> : <MdKeyboardArrowDown className="w-4 h-4 ml-0.5" />}
      </button>

      {mode === 'agent' && <AgentSelector />}

      {modeSelectorVisible && (
        <div className="absolute bottom-full mb-1 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10 min-w-[150px]">
          {MODES_ORDER.map((value) => {
            const { icon: Icon, labelKey } = MODE_CONFIG[value];
            return (
              <button
                key={value}
                onClick={() => handleModeChange(value)}
                className={`w-full px-3 py-1.5 text-left hover:bg-neutral-700 transition-colors duration-200 text-xs flex items-center gap-2
                ${value === mode ? 'text-white font-semibold bg-neutral-750' : 'text-neutral-300'}`}
              >
                <Icon className="w-4 h-4" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
