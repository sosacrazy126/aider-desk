import { ModelsData, SessionData } from '@common/types';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MdHistory } from 'react-icons/md';

import { ModelSelector, ModelSelectorRef } from '@/components/ModelSelector';
import { SessionsPopup } from '@/components/SessionsPopup';
import { StyledTooltip } from '@/components/common/StyledTooltip';
import { useSettings } from '@/context/SettingsContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useBooleanState } from '@/hooks/useBooleanState';

type Props = {
  baseDir: string;
  allModels?: string[];
  modelsData: ModelsData | null;
  architectMode: boolean;
  onModelChange?: () => void;
};

export type ProjectTopBarRef = {
  openMainModelSelector: () => void;
};

export const ProjectBar = React.forwardRef<ProjectTopBarRef, Props>(({ baseDir, allModels = [], modelsData, architectMode, onModelChange }, ref) => {
  const mainModelSelectorRef = useRef<ModelSelectorRef>(null);
  const architectModelSelectorRef = useRef<ModelSelectorRef>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionPopupVisible, showSessionPopup, hideSessionPopup] = useBooleanState(false);
  const sessionPopupRef = useRef<HTMLDivElement>(null);

  useClickOutside(sessionPopupRef, hideSessionPopup);

  useImperativeHandle(ref, () => ({
    openMainModelSelector: () => {
      if (architectMode) {
        architectModelSelectorRef.current?.open();
      } else {
        mainModelSelectorRef.current?.open();
      }
    },
  }));

  const { settings, saveSettings } = useSettings();

  const updatePreferredModels = useCallback(
    (model: string) => {
      if (!settings) {
        return;
      }
      const updatedSettings = {
        ...settings,
        models: {
          ...settings.models,
          preferred: [model, ...settings.models.preferred.filter((m) => m !== model)],
        },
      };
      void saveSettings(updatedSettings);
    },
    [saveSettings, settings],
  );

  const updateMainModel = useCallback(
    (mainModel: string) => {
      window.api.updateMainModel(baseDir, mainModel);
      updatePreferredModels(mainModel);
      onModelChange?.();
    },
    [baseDir, onModelChange, updatePreferredModels],
  );

  const updateWeakModel = useCallback(
    (weakModel: string) => {
      window.api.updateWeakModel(baseDir, weakModel);
      updatePreferredModels(weakModel);
      onModelChange?.();
    },
    [baseDir, onModelChange, updatePreferredModels],
  );

  const updateArchitectModel = useCallback(
    (architectModel: string) => {
      window.api.updateArchitectModel(baseDir, architectModel);
      updatePreferredModels(architectModel);
      onModelChange?.();
    },
    [baseDir, onModelChange, updatePreferredModels],
  );

  const loadSessions = useCallback(async () => {
    try {
      const sessionsList = await window.api.listSessions(baseDir);
      setSessions(sessionsList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    }
  }, [baseDir]);

  const saveSession = useCallback(
    async (name: string, loadMessages: boolean, loadFiles: boolean) => {
      try {
        await window.api.saveSession(baseDir, name, loadMessages, loadFiles);
        await loadSessions();
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    },
    [baseDir, loadSessions],
  );

  const updateSession = useCallback(
    async (name: string, loadMessages: boolean, loadFiles: boolean) => {
      try {
        await window.api.updateSession(baseDir, name, loadMessages, loadFiles);
        await loadSessions();
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    },
    [baseDir, loadSessions],
  );

  const loadSession = useCallback(
    async (name: string) => {
      try {
        await window.api.loadSession(baseDir, name);
        hideSessionPopup();
        // Refresh the sessions list to update the active session
        void loadSessions();
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    },
    [baseDir, hideSessionPopup, loadSessions],
  );

  const deleteSession = useCallback(
    async (name: string) => {
      try {
        await window.api.deleteSession(baseDir, name);
        await loadSessions();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [baseDir, loadSessions],
  );

  useEffect(() => {
    if (sessionPopupVisible) {
      void loadSessions();
    }
  }, [sessionPopupVisible, loadSessions]);

  return (
    <div className="relative group">
      {!modelsData ? (
        <div className="text-xs">Loading model...</div>
      ) : (
        <div className="flex items-center">
          <div className="flex-grow flex items-center space-x-3">
            {architectMode && (
              <>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">Architect model:</span>
                  <ModelSelector
                    ref={architectModelSelectorRef}
                    models={allModels}
                    selectedModel={modelsData.architectModel || modelsData.mainModel}
                    onChange={updateArchitectModel}
                  />
                </div>
                <div className="h-3 w-px bg-neutral-600/50"></div>
              </>
            )}
            <div className="flex items-center space-x-1">
              <span className="text-xs">{architectMode ? 'Editor model:' : 'Main model:'}</span>
              <ModelSelector ref={mainModelSelectorRef} models={allModels} selectedModel={modelsData.mainModel} onChange={updateMainModel} />
            </div>
            <div className="h-3 w-px bg-neutral-600/50"></div>
            <div className="flex items-center space-x-1">
              <span className="text-xs">Weak model:</span>
              <ModelSelector models={allModels} selectedModel={modelsData.weakModel || modelsData.mainModel} onChange={updateWeakModel} />
            </div>
            {modelsData.maxChatHistoryTokens && (
              <>
                <div className="h-3 w-px bg-neutral-600/50"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">Max tokens:</span>
                  <span className="text-neutral-400 text-xs">{modelsData.maxChatHistoryTokens}</span>
                </div>
              </>
            )}
            {modelsData.reasoningEffort && (
              <>
                <div className="h-3 w-px bg-neutral-600/50"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">Reasoning:</span>
                  <span className="text-neutral-400 text-xs">{modelsData.reasoningEffort}</span>
                </div>
              </>
            )}
            {modelsData.thinkingTokens && (
              <>
                <div className="h-3 w-px bg-neutral-600/50"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">Thinking tokens:</span>
                  <span className="text-neutral-400 text-xs">{modelsData.thinkingTokens}</span>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={showSessionPopup}
              className="p-0.5 hover:bg-neutral-700 rounded-md flex text-neutral-200"
              data-tooltip-id="session-history-tooltip"
              data-tooltip-content="Session history"
            >
              <MdHistory className="w-4 h-4" />
            </button>
            <StyledTooltip id="session-history-tooltip" />
            {sessionPopupVisible && (
              <div ref={sessionPopupRef}>
                <SessionsPopup
                  sessions={sessions}
                  onLoadSession={(name) => void loadSession(name)}
                  onSaveSession={(name, loadMessages, loadFiles) => {
                    void saveSession(name, loadMessages, loadFiles);
                  }}
                  onUpdateSession={(name, loadMessages, loadFiles) => {
                    void updateSession(name, loadMessages, loadFiles);
                  }}
                  onDeleteSession={(name) => {
                    void deleteSession(name);
                  }}
                  onClose={hideSessionPopup}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ProjectBar.displayName = 'ProjectTopBar';
