import * as XLSX from 'xlsx';

/**
 * Utility function to export array data as a native Microsoft Excel (.xlsx) file
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | undefined | null)[][],
  sheetName = 'Datos'
) {
  const data = [
    headers,
    ...rows.map((row) =>
      row.map((cell) => (cell === null || cell === undefined ? '' : cell))
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-calculate column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = String(h).length;
    rows.forEach((r) => {
      const cellVal = r[i];
      if (cellVal !== undefined && cellVal !== null) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanBase = filename.replace(/\.csv$/i, '').replace(/\.xlsx$/i, '');
  const fullFilename = `${cleanBase}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, fullFilename);
}

