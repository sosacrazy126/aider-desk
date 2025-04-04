import { ElementType, MouseEvent, useRef, useState } from 'react';
import { CgLock, CgLockUnlock, CgTerminal } from 'react-icons/cg';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { AiOutlineFileSearch } from 'react-icons/ai';
import { RiRobot2Line } from 'react-icons/ri';
import { GoProjectRoadmap } from 'react-icons/go';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { Mode } from '@common/types';
import { useTranslation } from 'react-i18next';

import { McpSelector } from './McpSelector';
import { StyledTooltip } from './common/StyledTooltip';

import { useClickOutside } from '@/hooks/useClickOutside';

type ModeConfig = {
  icon: ElementType;
  labelKey: string;
  tooltipKey: string;
  isLockable: boolean;
};

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  code: {
    icon: CgTerminal,
    labelKey: 'mode.code',
    tooltipKey: 'modeTooltip.code',
    isLockable: false,
  },
  agent: {
    icon: RiRobot2Line,
    labelKey: 'mode.agent',
    tooltipKey: 'modeTooltip.agent',
    isLockable: false,
  },
  ask: {
    icon: FaRegQuestionCircle,
    labelKey: 'mode.ask',
    tooltipKey: 'modeTooltip.ask',
    isLockable: true,
  },
  architect: {
    icon: GoProjectRoadmap,
    labelKey: 'mode.architect',
    tooltipKey: 'modeTooltip.architect',
    isLockable: true,
  },
  context: {
    icon: AiOutlineFileSearch,
    labelKey: 'mode.context',
    tooltipKey: 'modeTooltip.context',
    isLockable: true,
  },
};

const MODES_ORDER: Mode[] = ['code', 'agent', 'ask', 'architect', 'context'];

type Props = {
  mode: Mode;
  locked: boolean;
  onModeChange: (mode: Mode) => void;
  onLockedChange: (locked: boolean) => void;
};

export const ModeSelector = ({ mode, locked, onModeChange, onLockedChange }: Props) => {
  const { t } = useTranslation();
  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  useClickOutside(modeSelectorRef, () => setModeSelectorVisible(false));

  const toggleModeSelectorVisible = () => setModeSelectorVisible((prev) => !prev);

  const handleModeChange = (newMode: Mode) => {
    onModeChange(newMode);
    setModeSelectorVisible(false);
  };

  const handleLockClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onLockedChange(!locked);
  };

  const { icon: CurrentModeIcon, labelKey: currentModeLabelKey, isLockable: isCurrentModeLockable } = MODE_CONFIG[mode];

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
      {isCurrentModeLockable && (
        <button
          onClick={handleLockClick}
          className="px-2 py-1 bg-neutral-850 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 focus:outline-none transition-colors duration-200 border-neutral-600 border rounded-md"
          data-tooltip-id="mode-lock-tooltip"
          data-tooltip-content={locked ? t('common.unlock') : t('common.lock')}
        >
          {locked ? <CgLock className="w-4 h-4" /> : <CgLockUnlock className="w-4 h-4" />}
        </button>
      )}
      {isCurrentModeLockable && <StyledTooltip id="mode-lock-tooltip" />}

      {mode === 'agent' && <McpSelector />}

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
