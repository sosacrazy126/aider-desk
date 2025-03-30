import { useState } from 'react';

import { BaseDialog } from './BaseDialog';
import { Button } from './common/Button';
import { Checkbox } from './common/Checkbox';
import { Input } from './common/Input';

type Props = {
  onClose: () => void;
  onSave: (name: string, loadMessages: boolean, loadFiles: boolean) => void;
  initialName?: string;
  initialLoadMessages?: boolean;
  initialLoadFiles?: boolean;
  isEdit?: boolean;
};

export const SessionDialog = ({ onClose, onSave, initialName = '', initialLoadMessages = true, initialLoadFiles = true, isEdit = false }: Props) => {
  const [name, setName] = useState(initialName);
  const [loadMessages, setLoadMessages] = useState(initialLoadMessages);
  const [loadFiles, setLoadFiles] = useState(initialLoadFiles);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave(name.trim(), loadMessages, loadFiles);
    onClose();
  };

  return (
    <BaseDialog
      title={isEdit ? 'Edit Session' : 'Save Session'}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Session Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter session name" autoFocus />

        <div className="pt-2">
          <h3 className="text-sm font-medium mb-2">Load Settings</h3>
          <div className="space-y-2">
            <Checkbox label="Load messages from this session" checked={loadMessages} onChange={() => setLoadMessages(!loadMessages)} />
            <Checkbox label="Load context files from this session" checked={loadFiles} onChange={() => setLoadFiles(!loadFiles)} />
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};
