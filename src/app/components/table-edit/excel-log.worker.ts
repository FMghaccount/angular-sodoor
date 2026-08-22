/// <reference lib="webworker" />

import moment from 'jalali-moment';

addEventListener('message', async ({ data }) => {
  const { tableData } = data;

  try {
    const excelRowData: any = [];
    tableData.forEach((item, i) => {
      excelRowData.push({
        ...item,
        birthDateJalali: formatJalali(item.birthDate)
      })
    })
    postMessage({ success: true, tableRows: excelRowData });
  } catch (error) {
    postMessage({ success: false, error: (error as Error).message });
  }
});

function formatJalali(date: Date): string {
  if (!date) return '';
  return moment(date).locale('fa').format('jYYYY/jMM/jDD');
}
