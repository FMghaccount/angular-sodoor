/// <reference lib="webworker" />
import * as XLSX from 'xlsx';

addEventListener('message', async ({ data }) => {
  const { file, statusOptions } = data;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataBuffer = new Uint8Array(arrayBuffer);

    // Read Excel File off the main thread
    const workbook = XLSX.read(dataBuffer, { type: 'array', cellDates: false, raw: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const importedProducts: any[] = [];
    const rows = rawData.slice(1); // Skip header row
    const baseId = Date.now();

    rows.forEach((row, index) => {
      if (!row || row.length === 0) return;

      const [name, age, statusLabel, birthDateVal] = row;

      // Status Mapping
      const mappedStatus = statusOptions.find(
        (opt: any) => opt.label === String(statusLabel ?? '').trim()
      )?.value || 'Active';

      // Excel Serial Date / String parsing inside worker
      const parsedDate = parseWorkerExcelDate(birthDateVal);

      importedProducts.push({
        id: baseId + index,
        name: name ? String(name).trim() : 'بدون نام',
        age: Number(age) || 18,
        status: mappedStatus,
        birthDate: parsedDate
      });
    });

    postMessage({ success: true, products: importedProducts });
  } catch (error) {
    postMessage({ success: false, error: (error as Error).message });
  }
});

// Helper for parsing Excel dates inside the worker thread
function parseWorkerExcelDate(value: any): string {
  if (typeof value === 'number') {
    const jsDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return jsDate.toISOString().split('T')[0];
  }
  return value ? String(value).trim() : '';
}
