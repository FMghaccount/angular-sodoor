/// <reference lib="webworker" />

addEventListener('message', async ({ data }) => {
  const { count } = data;

  try {
    const excelRowData: any = [];
    const items = Array.from({ length: count }, (_, i) => i);
    items.forEach((_, i) => {
      excelRowData.push({
        'نام': 'نمونه نام 1',
        'سن': 20,
        'وضعیت': 'فعال',
        'تاریخ تولد': '6/10/1999',
      })
    })
    postMessage({ success: true, products: excelRowData });
  } catch (error) {
    postMessage({ success: false, error: (error as Error).message });
  }
});
