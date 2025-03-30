import { SessionData } from '@common/types';
import { useState } from 'react';
import { IoDocumentTextOutline, IoListOutline, IoPencil, IoTrashOutline } from 'react-icons/io5';

import { SessionDialog } from './SessionDialog';
import { Button } from './common/Button';
import { ConfirmDialog } from './ConfirmDialog';
import { StyledTooltip } from './common/StyledTooltip';

type Props = {
  sessions: SessionData[];
  onLoadSession: (name: string) => void;
  onSaveSession: (name: string, loadMessages: boolean, loadFiles: boolean) => void;
  onUpdateSession: (name: string, loadMessages: boolean, loadFiles: boolean) => void;
  onDeleteSession: (name: string) => void;
  onClose: () => void;
};

export const SessionsPopup = ({ sessions, onLoadSession, onSaveSession, onUpdateSession, onDeleteSession }: Props) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editSession, setEditSession] = useState<SessionData | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleSaveSession = (name: string, loadMessages: boolean, loadFiles: boolean) => {
    onSaveSession(name, loadMessages, loadFiles);
    setShowSaveDialog(false);
  };

  const handleUpdateSession = (name: string, loadMessages: boolean, loadFiles: boolean) => {
    if (editSession && name !== editSession.name) {
      // If name changed, delete old session and create new one
      onDeleteSession(editSession.name);
      onSaveSession(name, loadMessages, loadFiles);
    } else {
      // If name is the same, just update
      onUpdateSession(name, loadMessages, loadFiles);
    }
    setEditSession(null);
  };

  const handleDeleteSession = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50 w-64">
      <div className="">
        <div className="p-2 text-xs font-medium border-b border-neutral-700">SESSIONS</div>
        {sessions.length === 0 ? (
          <div className="text-xs text-neutral-400 p-2">No saved sessions</div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.name}
                className="flex items-center justify-between text-xs px-2 py-0.5 cursor-pointer hover:bg-neutral-700"
                onClick={() => onLoadSession(session.name)}
              >
                <div className="flex items-center">
                  <span className={`mr-2 ${session.active ? 'text-white' : ' text-neutral-300'}`}>{session.name}</span>
                </div>
                <div className="flex items-center">
                  {session.loadMessages && (
                    <div
                      className="p-1"
                      data-tooltip-id={`loads-messages-tooltip-${session.name}`}
                      data-tooltip-content={`Loads ${session.messages || 0} messages`}
                    >
                      <IoListOutline className="text-neutral-500 w-3 h-3" />
                      <StyledTooltip id={`loads-messages-tooltip-${session.name}`} />
                    </div>
                  )}
                  {session.loadFiles && (
                    <div className="p-1" data-tooltip-id={`loads-files-tooltip-${session.name}`} data-tooltip-content={`Loads ${session.files || 0} files`}>
                      <IoDocumentTextOutline className="text-neutral-500 w-3 h-3" />
                      <StyledTooltip id={`loads-files-tooltip-${session.name}`} />
                    </div>
                  )}
                  {session.active && (
                    <>
                      <button
                        className="p-1 hover:bg-neutral-600 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSession(session);
                        }}
                        data-tooltip-id="edit-session-tooltip"
                        data-tooltip-content="Edit session"
                      >
                        <IoPencil className="text-neutral-200 w-3 h-3" />
                      </button>
                      <StyledTooltip id="edit-session-tooltip" />
                    </>
                  )}

                  <button
                    className="p-1 hover:bg-neutral-600 rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.name);
                    }}
                    data-tooltip-id="delete-session-tooltip"
                    data-tooltip-content="Delete session"
                  >
                    <IoTrashOutline className="text-neutral-200 w-3 h-3" />
                  </button>
                  <StyledTooltip id="delete-session-tooltip" />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-2 pb-2 border-t border-neutral-700 flex justify-center">
          <Button variant="text" className="text-xs mt-2" onClick={() => setShowSaveDialog(true)}>
            Save as new
          </Button>
        </div>
      </div>

      {showSaveDialog && <SessionDialog onClose={() => setShowSaveDialog(false)} onSave={handleSaveSession} />}

      {editSession && (
        <SessionDialog
          onClose={() => setEditSession(null)}
          onSave={handleUpdateSession}
          initialName={editSession.name}
          initialLoadMessages={editSession.loadMessages}
          initialLoadFiles={editSession.loadFiles}
          isEdit
        />
      )}

      {sessionToDelete && (
        <ConfirmDialog title="Delete Session" onConfirm={handleDeleteSession} onCancel={() => setSessionToDelete(null)} confirmButtonText="Delete">
          <p>
            Are you sure you want to delete the session &quot;{sessionToDelete}
            &quot;?
          </p>
          <p className="text-sm text-neutral-400 mt-1">This action cannot be undone.</p>
        </ConfirmDialog>
      )}
    </div>
  );
};
