import { useTranslation } from 'react-i18next';
import { RiToolsFill } from 'react-icons/ri';
import { getLanguageFromPath } from '@common/utils';

import { ToolMessage } from '@/types/message';
import { MessageBar } from '@/components/message/MessageBar';
import { CodeBlock } from '@/components/message/CodeBlock';

type Props = {
  message: ToolMessage;
  onRemove?: () => void;
};

export const EditFileToolMessage = ({ message, onRemove }: Props) => {
  const { t } = useTranslation();

  const filePath = message.args.filePath as string;
  const searchTerm = message.args.searchTerm as string;
  const replacementText = message.args.replacementText as string;
  const isRegex = message.args.isRegex as boolean;
  const replaceAll = message.args.replaceAll as boolean;

  const getToolDisplayName = (): string => {
    return t('toolMessage.power.fileEdit.title', { filePath });
  };

  const language = getLanguageFromPath(filePath);

  return (
    <div className="border border-neutral-800 rounded-md mb-2 group p-3 bg-neutral-850">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-neutral-500">
          <RiToolsFill className="w-4 h-4" />
        </div>
        <div className="text-xs text-neutral-100">{getToolDisplayName()}</div>
      </div>

      <div className="text-xs text-neutral-300 bg-neutral-850">
        {isRegex ? (
          <div className="p-2 bg-neutral-900 rounded-md">
            <p>
              <strong>{t('toolMessage.power.fileEdit.searchTerm')}:</strong> <code>{searchTerm}</code> ({t('toolMessage.power.fileEdit.regex')})
            </p>
            <p>
              <strong>{t('toolMessage.power.fileEdit.replacementText')}:</strong> <code>{replacementText}</code>
            </p>
            <p>
              <strong>{t('toolMessage.power.fileEdit.replaceAll')}:</strong> {replaceAll ? t('common.yes') : t('common.no')}
            </p>
          </div>
        ) : (
          <CodeBlock baseDir="" language={language} file={filePath} isComplete={true} oldValue={searchTerm} newValue={replacementText} />
        )}
      </div>
      <MessageBar content={message.content} usageReport={message.usageReport} remove={onRemove} />
    </div>
  );
};
