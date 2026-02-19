import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Item, UsageLog } from '../types';
import { costPerUse, dailyHoldingCost, netCost, formatCurrency, daysSince } from './calculations';
import { RETIREMENT_CONFIG } from '../constants/theme';

interface ExportOptions {
    items: Item[];
    usageLogs: UsageLog[];
    fromDate: Date;
    toDate: Date;
}

function getLogsInRange(logs: UsageLog[], itemId: string, from: Date, to: Date): UsageLog[] {
    return logs.filter((l) => {
        if (l.itemId !== itemId) return false;
        const d = new Date(l.date);
        return d >= from && d <= to;
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export async function exportPDF({ items, usageLogs, fromDate, toDate }: ExportOptions) {
    const rows = items.map((item) => {
        const logsInRange = getLogsInRange(usageLogs, item.id, fromDate, toDate);
        const totalLogs = usageLogs.filter((l) => l.itemId === item.id);
        const cost =
            item.costMethod === 'per-use'
                ? costPerUse(item, totalLogs.length)
                : dailyHoldingCost(item);
        const costStr = cost !== null ? formatCurrency(cost) : '—';
        const methodLabel = item.costMethod === 'per-use' ? 'Cost/Use' : 'Daily Cost';
        const retireInfo = item.retirementReason
            ? `${RETIREMENT_CONFIG[item.retirementReason].emoji} ${RETIREMENT_CONFIG[item.retirementReason].label}`
            : '—';

        return `
      <tr>
        <td>${item.emoji} ${item.name}</td>
        <td>${item.category}</td>
        <td>${formatCurrency(item.purchasePrice)}</td>
        <td>${logsInRange.length}</td>
        <td>${costStr} <span class="method">${methodLabel}</span></td>
        <td>${item.status === 'retired' ? retireInfo : 'Active'}</td>
      </tr>`;
    });

    const totalPurchaseValue = items.reduce((s, i) => s + i.purchasePrice, 0);
    const totalUses = items.reduce(
        (s, i) => s + usageLogs.filter((l) => l.itemId === i.id).length,
        0
    );

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, sans-serif; background: #0D0D14; color: #F0F0FF; margin: 0; padding: 24px; }
  .header { text-align: center; margin-bottom: 32px; }
  .app-name { font-size: 28px; font-weight: 800; color: #7C6FFF; }
  .tagline { font-size: 13px; color: #9090B0; margin-top: 4px; }
  .range { font-size: 13px; color: #9090B0; margin-top: 8px; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat { background: #1E1E2E; border-radius: 12px; padding: 16px; flex: 1; text-align: center; border: 1px solid #2A2A3D; }
  .stat-value { font-size: 22px; font-weight: 700; color: #7C6FFF; }
  .stat-label { font-size: 11px; color: #9090B0; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1E1E2E; color: #9090B0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; text-align: left; border-bottom: 1px solid #2A2A3D; }
  td { padding: 12px; border-bottom: 1px solid #1E1E2E; font-size: 13px; color: #F0F0FF; }
  tr:nth-child(even) td { background: #16161F; }
  .method { font-size: 10px; color: #9090B0; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #5A5A7A; }
</style>
</head>
<body>
<div class="header">
  <div class="app-name">✨ Use it Well</div>
  <div class="tagline">Personal Item Cost Tracker</div>
  <div class="range">Report: ${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString()}</div>
</div>
<div class="summary">
  <div class="stat"><div class="stat-value">${items.length}</div><div class="stat-label">Items Tracked</div></div>
  <div class="stat"><div class="stat-value">${formatCurrency(totalPurchaseValue)}</div><div class="stat-label">Total Invested</div></div>
  <div class="stat"><div class="stat-value">${totalUses}</div><div class="stat-label">Total Uses</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>Item</th><th>Category</th><th>Purchase Price</th><th>Uses in Range</th><th>Cost Metric</th><th>Status</th>
    </tr>
  </thead>
  <tbody>${rows.join('')}</tbody>
</table>
<div class="footer">Use it Well · Less is more · Don't waste your money buying new stuff all the time</div>
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
}

export async function exportCSV({ items, usageLogs, fromDate, toDate }: ExportOptions) {
    const header = 'Item,Category,Purchase Price,Purchase Date,Uses in Range,Total Uses,Cost Metric,Cost Value,Status,Retirement Reason,Sale Price\n';
    const rows = items.map((item) => {
        const logsInRange = getLogsInRange(usageLogs, item.id, fromDate, toDate);
        const totalLogs = usageLogs.filter((l) => l.itemId === item.id);
        const cost =
            item.costMethod === 'per-use'
                ? costPerUse(item, totalLogs.length)
                : dailyHoldingCost(item);
        const costStr = cost !== null ? cost.toFixed(2) : '';
        const methodLabel = item.costMethod === 'per-use' ? 'Cost/Use' : 'Daily Cost';
        const retireReason = item.retirementReason
            ? RETIREMENT_CONFIG[item.retirementReason].label
            : '';
        const salePrice = item.salePrice ? item.salePrice.toFixed(2) : '';

        return [
            `"${item.name}"`,
            `"${item.category}"`,
            item.purchasePrice.toFixed(2),
            formatDate(item.purchaseDate),
            logsInRange.length,
            totalLogs.length,
            methodLabel,
            costStr,
            item.status === 'retired' ? 'Retired' : 'Active',
            retireReason,
            salePrice,
        ].join(',');
    });

    const csv = header + rows.join('\n');
    const fileUri = (FileSystem.cacheDirectory ?? '') + 'use-it-well-report.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: '.csv' });
}
