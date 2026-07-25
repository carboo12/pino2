import { saveAs } from 'file-saver';

/**
 * Exports an array of objects to an Excel (.xlsx) file.
 * @param data - Array of flat objects (each object = one row)
 * @param fileName - Name of the file (without extension)
 * @param sheetName - Name of the Excel sheet (default: "Datos")
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  fileName: string,
  sheetName = 'Datos',
) {
  const XLSX = await import('xlsx');
  if (data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, `${fileName}.xlsx`);
}
