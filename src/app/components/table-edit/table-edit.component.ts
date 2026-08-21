import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {InputNumberModule} from 'primeng/inputnumber';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {DatePickerModule} from 'primeng/datepicker';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService, TreeNode} from 'primeng/api';
import moment from 'jalali-moment';
import * as XLSX from 'xlsx';
import {TreeSelect} from 'primeng/treeselect';
import {CustomTreeSelectComponent} from '../custom-tree-select/custom-tree-select.component';

interface StatusOption {
  label: string;
  value: string;
}

interface RowData {
  id: number;
  name: string;
  age: number;
  status: string;
  birthDate: Date;
}

@Component({
  selector: 'app-table-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    DatePickerModule,
    ConfirmDialogModule,
    TreeSelect,
    CustomTreeSelectComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './table-edit.component.html',
  styleUrls: ['./table-edit.component.scss']
})
export class TableEditComponent implements OnInit {

  @ViewChild('treeSelect') treeSelect: TreeSelect | undefined
  products: RowData[] = [];
  editForm!: FormGroup;
  addRowForm!: FormGroup;
  parentForm!: FormGroup;

  rowsPerPageOptions: number[] = [5, 10, 20];
  rows: number = 5;

  statusOptions: StatusOption[] = [
    {label: 'فعال', value: 'Active'},
    {label: 'در انتظار', value: 'Pending'},
    {label: 'غیرفعال', value: 'Inactive'}
  ];

  categoryOptions = [
    {label: 'عمومی', value: 'General'},
    {label: 'مالی', value: 'Finance'},
    {label: 'اداری', value: 'Administrative'}
  ];

  treeNodes: TreeNode[] = [
    {
      key: '1',
      label: 'گروه اصلی ۱',
      data: 'Category 1',
      children: [
        {key: '1-1', label: 'زیرمجموعه ۱-۱', data: 'Sub 1-1'},
        {key: '1-2', label: 'زیرمجموعه ۱-۲', data: 'Sub 1-2'}
      ]
    },
    {
      key: '2',
      label: 'گروه اصلی ۲',
      data: 'Category 2',
      children: [
        {
          key: '2-1',
          label: 'زیرمجموعه ۲-۱',
          data: 'Sub 2-1',
          children: [
            {key: '2-1-1', label: 'سطح سوم ۲-۱-۱', data: 'Level 3'}
          ]
        }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
  }

  ngOnInit(): void {

    this.parentForm = this.fb.group({
      title: ['گزارش شماره ۱', [Validators.required]],
      category: ['General', [Validators.required]],
      categoryNode: [null, [Validators.required]],
      description: ['توضیحات اولیه']
    });

    this.products = [
      {id: 1, name: 'محصول الف', age: 25, status: 'Active', birthDate: moment('1378/03/22', 'jYYYY/jMM/jDD').toDate()},
      {id: 2, name: 'محصول ب', age: 34, status: 'Pending', birthDate: moment('1369/06/01', 'jYYYY/jMM/jDD').toDate()},
      {id: 3, name: 'محصول ج', age: 29, status: 'Active', birthDate: moment('1373/11/21', 'jYYYY/jMM/jDD').toDate()},
      {id: 4, name: 'محصول د', age: 41, status: 'Inactive', birthDate: moment('1362/08/13', 'jYYYY/jMM/jDD').toDate()}
    ];

    this.addRowForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(100)]],
      status: [null, [Validators.required]],
      birthDate: [null, [Validators.required]]
    });
  }

  // --- EXCEL TEMPLATE DOWNLOAD (WITH DIRECTORY PICKER) ---
  async downloadTemplate(): Promise<void> {
    const headers = [['نام', 'سن', 'وضعیت', 'تاریخ تولد']];
    const sampleRow = [['نمونه نام', 25, 'فعال', '1378/01/01']];

    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب_جدول');

    const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

    // Use File System Access API if supported (allows user to select directory)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'template.xlsx',
          types: [{
            description: 'Excel File',
            accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Save file error:', err);
      }
    } else {
      // Fallback download for unsupported browsers
      XLSX.writeFile(workbook, 'template.xlsx');
    }
  }

  // --- EXCEL IMPORT FUNCTIONALITY ---
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);

      // Set cellDates: false to get raw numbers/strings and prevent local timezone conversion shift
      const workbook = XLSX.read(data, {type: 'array', cellDates: false, raw: true});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {header: 1});
      console.log(rawData)

      const importedProducts: RowData[] = [];
      const rows = rawData.slice(1); // Skip header

      rows.forEach((row, index) => {
        if (!row || row.length === 0) return;

        const [name, age, statusLabel, birthDateVal] = row;

        const mappedStatus = this.statusOptions.find(
          (opt) => opt.label === String(statusLabel ?? '').trim()
        )?.value || 'Active';

        const parsedDate = this.parseExcelDate(birthDateVal);

        importedProducts.push({
          id: Date.now() + index,
          name: name ? String(name).trim() : 'بدون نام',
          age: Number(age) || 18,
          status: mappedStatus,
          birthDate: parsedDate
        });
      });

      this.products = [...importedProducts, ...this.products];
      target.value = ''; // Reset input
    };

    reader.readAsArrayBuffer(file);
  }

  // Existing methods
  onEditInit(field: string, currentValue: any): void {
    this.editForm = this.fb.group({
      [field]: [currentValue, this.getValidatorsForField(field)]
    });
  }

  private getValidatorsForField(field: string) {
    switch (field) {
      case 'name':
        return [Validators.required, Validators.minLength(3)];
      case 'age':
        return [Validators.required, Validators.min(18), Validators.max(100)];
      case 'status':
        return [Validators.required];
      case 'birthDate':
        return [Validators.required];
      default:
        return [];
    }
  }

  onEditSave(row: RowData, field: keyof RowData): void {
    const control = this.editForm.get(field);
    if (control && control.valid) {
      row[field] = control.value as never;
    }
  }

  onAddRow(): void {
    if (this.addRowForm.invalid) {
      this.addRowForm.markAllAsTouched();
      return;
    }

    const newRow: RowData = {
      id: Date.now(),
      ...this.addRowForm.value
    };

    this.products = [newRow, ...this.products];
    this.addRowForm.reset();
  }

  confirmDelete(row: RowData): void {
    this.confirmationService.confirm({
      message: `آیا از حذف «${row.name}» اطمینان دارید؟`,
      header: 'تایید حذف',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {label: 'حذف', severity: 'danger'},
      rejectButtonProps: {label: 'انصراف', severity: 'secondary', outlined: true},
      accept: () => {
        this.products = this.products.filter((p) => p.id !== row.id);
      }
    });
  }

  logTableData(): void {
    // Validate parent form if necessary
    if (this.parentForm.invalid) {
      this.parentForm.markAllAsTouched();
    }

    const exportedTableData = this.products.map((item) => ({
      ...item,
      birthDateJalali: this.formatJalali(item.birthDate)
    }));

    // Array output containing parent form data and table array
    const resultPayload = [
      {
        parent: this.parentForm.value,
        data: exportedTableData
      }
    ];
    this.parentForm.reset();
    this.addRowForm.reset();
    this.editForm.reset();
    console.log('Final Payload Output:', resultPayload);
  }

  formatJalali(date: Date): string {
    if (!date) return '';
    return moment(date).locale('fa').format('jYYYY/jMM/jDD');
  }

  getStatusLabel(statusValue: string): string {
    const option = this.statusOptions.find((opt) => opt.value === statusValue);
    return option ? option.label : statusValue;
  }

  // --- ACCURATE DATE PARSER ---
  private parseExcelDate(val: any): Date {
    if (val === null || val === undefined || val === '') return new Date();

    // 1. If it is an Excel Serial Number (e.g., 36321)
    if (typeof val === 'number') {
      // Formula to calculate exact UTC date without local timezone offset
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400 * 1000;
      const dateObj = new Date(utcValue);

      // Construct local date using UTC components (year, month, day)
      return new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    }

    // 2. If it is already a JS Date object
    if (val instanceof Date) {
      return new Date(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate());
    }

    // 3. If it is a string (ISO date, GMT string, or Jalali format)
    if (typeof val === 'string') {
      const trimmed = val.trim();

      // Handle Jalali dates (e.g. "1378/03/20")
      if (trimmed.startsWith('13') || trimmed.startsWith('14')) {
        return moment(trimmed, ['jYYYY/jMM/jDD', 'jYYYY-jMM-jDD']).toDate();
      }

      // Handle ISO/GMT strings by reading UTC dates
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        // Extract UTC parts to eliminate local timezone offset shift
        return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
      }
    }

    return new Date();
  }
}
