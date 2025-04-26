import { FaArrowDown, FaArrowUp, FaDollarSign } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { UsageReportData } from '@common/types';

import { CopyMessageButton } from './CopyMessageButton';

type Props = {
  content: string;
  usageReport?: UsageReportData;
};

export const MessageBar = ({ content, usageReport }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="mt-3 pt-3 h-[28px] flex items-center justify-end gap-2 border-t border-neutral-800 px-1">
      {usageReport && (
        <div className="flex items-center gap-3 px-2 text-xxs text-neutral-500 group-hover:text-neutral-200 transition-colors">
          <span className="flex items-center gap-1" data-tooltip-id="usage-info-tooltip" data-tooltip-content={t('responseMessage.inputTokens')}>
            <FaArrowUp className="w-2.5 h-2.5 mb-0.5" /> {usageReport.sentTokens}
          </span>
          <span className="flex items-center gap-1" data-tooltip-id="usage-info-tooltip" data-tooltip-content={t('responseMessage.outputTokens')}>
            <FaArrowDown className="w-2.5 h-2.5 mb-0.5" /> {usageReport.receivedTokens}
          </span>
          {usageReport.messageCost > 0 && (
            <span className="flex items-center gap-1">
              <FaDollarSign className="w-2.5 h-2.5 mb-0.5" /> {usageReport.messageCost.toFixed(5)}
            </span>
          )}
        </div>
      )}
      <CopyMessageButton content={content} className="transition-colors text-neutral-700 group-hover:text-neutral-200" alwaysShow={true} />
    </div>
  );
};
