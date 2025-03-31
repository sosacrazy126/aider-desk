import { McpTool } from '@common/types';

import { Checkbox } from '@/components/common/Checkbox';

type Props = {
  tool: McpTool;
  toggleDisabled: () => void;
  isDisabled: boolean;
};

export const McpToolItem = ({ tool, toggleDisabled, isDisabled }: Props) => {
  return (
    <div className="border border-neutral-700 rounded p-2">
      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-sm">{tool.name}</div>
        <Checkbox checked={!isDisabled} onChange={toggleDisabled} className="ml-2" />
      </div>
      <div className="text-neutral-400">{tool.description || 'No description'}</div>
    </div>
  );
};
