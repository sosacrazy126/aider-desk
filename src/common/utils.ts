import { UsageReportData } from './types';

export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const parseUsageReport = (report: string): UsageReportData => {
  const sentMatch = report.match(/Tokens: ([\d.]+k?) sent/);
  const receivedMatch = report.match(/([\d.]+k?) received/);
  const messageCostMatch = report.match(/Cost: \$(\d+\.\d+) message/);
  const totalCostMatch = report.match(/\$(\d+\.\d+) session/);

  const parseTokens = (tokenStr: string): number => {
    if (tokenStr.includes('k')) {
      return parseFloat(tokenStr.replace('k', '')) * 1000;
    }
    return parseFloat(tokenStr);
  };

  const sentTokens = sentMatch ? parseTokens(sentMatch[1]) : 0;
  const receivedTokens = receivedMatch ? parseTokens(receivedMatch[1]) : 0;

  const messageCost = messageCostMatch ? parseFloat(messageCostMatch[1]) : 0;
  const totalCost = totalCostMatch ? parseFloat(totalCostMatch[1]) : 0;

  return {
    sentTokens,
    receivedTokens,
    messageCost,
    totalCost,
  };
};

export const normalizeBaseDir = (baseDir: string): string => {
  // On Windows, paths are case-insensitive so we normalize to lowercase
  return process.platform === 'win32' ? baseDir.toLowerCase() : baseDir;
};
