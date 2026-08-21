import { Component, OnInit, inject, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';

export interface ColumnDef {
  field: string;
  header: string;
  type: 'text' | 'numeric' | 'date';
}

export interface ParentRowData {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  price: number;
  createdDate: string;
}

const SINGLE_TABLE_DATA_KEY = makeStateKey<{ data: ParentRowData[]; totalRecords: number }>('single_table_data_key');

@Component({
  selector: 'app-table-single-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    MultiSelectModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  templateUrl: './table-single-export.component.html',
  styleUrls: ['./table-single-export.component.scss']
})
export class TableSingleExportComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  cols!: ColumnDef[];
  selectedColumns!: ColumnDef[];
  data: ParentRowData[] = [];
  selectedRow: ParentRowData | null = null;
  totalRecords: number = 0;
  loading: boolean = true;
  globalFilterValue: string = '';

  private mockDatabase: ParentRowData[] = [];

  ngOnInit(): void {
    // 1. Column Definitions
    this.cols = [
      { field: 'id', header: 'شناسه', type: 'numeric' },
      { field: 'code', header: 'کد محصول', type: 'text' },
      { field: 'name', header: 'نام', type: 'text' },
      { field: 'category', header: 'دسته‌بندی', type: 'text' },
      { field: 'quantity', header: 'موجودی', type: 'numeric' },
      { field: 'status', header: 'وضعیت', type: 'text' },
      { field: 'price', header: 'قیمت', type: 'numeric' },
      { field: 'createdDate', header: 'تاریخ ثبت', type: 'text' }
    ];

    this.selectedColumns = [...this.cols];
    this.generateMockDatabase(100);
  }

  // --- SSR Hydrated Lazy Data Loading ---
  loadDataLazy(event: TableLazyLoadEvent): void {
    if (this.transferState.hasKey(SINGLE_TABLE_DATA_KEY)) {
      const cached = this.transferState.get(SINGLE_TABLE_DATA_KEY, { data: [], totalRecords: 0 });
      this.data = cached.data;
      this.totalRecords = cached.totalRecords;
      this.loading = false;
      this.transferState.remove(SINGLE_TABLE_DATA_KEY);
      return;
    }

    this.loading = true;

    setTimeout(() => {
      let filteredData = [...this.mockDatabase];

      // Global Search
      if (this.globalFilterValue) {
        const query = this.globalFilterValue.toLowerCase();
        filteredData = filteredData.filter(item =>
          Object.values(item).some(val =>
            String(val).toLowerCase().includes(query)
          )
        );
      }

      // Advanced Column Filtering
      if (event.filters) {
        Object.keys(event.filters).forEach(field => {
          const filterMetaData = event.filters![field];
          if (!filterMetaData) return;

          const rules = Array.isArray(filterMetaData)
            ? filterMetaData
            : (filterMetaData as any).constraints || [filterMetaData];

          const operator = (filterMetaData as any).operator || 'AND';

          filteredData = filteredData.filter(item => {
            const itemValue = (item as any)[field];

            const ruleResults = rules.map((rule: any) => {
              if (rule.value === null || rule.value === undefined || rule.value === '') {
                return true;
              }
              return this.evaluateFilterRule(itemValue, rule.matchMode, rule.value);
            });

            return operator === 'AND'
              ? ruleResults.every((res: any) => res)
              : ruleResults.some((res: any) => res);
          });
        });
      }

      // Sorting
      if (event.sortField) {
        const field = event.sortField as keyof ParentRowData;
        const order = event.sortOrder || 1;
        filteredData.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          return (valA < valB ? -1 : valA > valB ? 1 : 0) * order;
        });
      }

      // Pagination
      this.totalRecords = filteredData.length;
      const first = event.first || 0;
      const rows = event.rows || 10;
      this.data = filteredData.slice(first, first + rows);

      if (isPlatformServer(this.platformId)) {
        this.transferState.set(SINGLE_TABLE_DATA_KEY, {
          data: this.data,
          totalRecords: this.totalRecords
        });
      }

      this.loading = false;
    }, 500);
  }

  // --- Rule Match Evaluator ---
  private evaluateFilterRule(itemValue: any, matchMode: string, filterValue: any): boolean {
    if (itemValue === null || itemValue === undefined) return false;

    const strItem = String(itemValue).toLowerCase();
    const strFilter = String(filterValue).toLowerCase();
    const numItem = Number(itemValue);
    const numFilter = Number(filterValue);

    switch (matchMode) {
      case 'startsWith': return strItem.startsWith(strFilter);
      case 'contains': return strItem.includes(strFilter);
      case 'notContains': return !strItem.includes(strFilter);
      case 'endsWith': return strItem.endsWith(strFilter);
      case 'equals': return strItem === strFilter || numItem === numFilter;
      case 'notEquals': return strItem !== strFilter && numItem !== numFilter;
      case 'gt': return numItem > numFilter;
      case 'gte': return numItem >= numFilter;
      case 'lt': return numItem < numFilter;
      case 'lte': return numItem <= numFilter;
      default: return strItem.includes(strFilter);
    }
  }

  onGlobalFilter(table: any, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }

  clearTable(table: any): void {
    this.globalFilterValue = '';
    this.selectedRow = null;
    table.clear();
  }

  // --- Single Excel File Export ---
  downloadSelectedAsExcel(): void {
    if (!this.selectedRow) return;

    const row = this.selectedRow;

    // Single Row Excel Dataset with Persian Headers
    const excelRowData = [
      {
        'شناسه': row.id,
        'کد محصول': row.code,
        'نام': row.name,
        'دسته‌بندی': row.category,
        'موجودی': row.quantity,
        'وضعیت': row.status,
        'قیمت': row.price,
        'تاریخ ثبت': row.createdDate
      }
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelRowData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'داده_ردیف': worksheet },
      SheetNames: ['داده_ردیف']
    };

    // Prompt Excel File Download Directly
    XLSX.writeFile(workbook, `ردیف_${row.id}_${row.code}.xlsx`);
  }

  // --- Persian Mock Database Generator ---
  private generateMockDatabase(count: number): void {
    const categories = ['الکترونیک', 'ورزشی', 'اداری', 'خانگی', 'اسباب‌بازی'];
    const statuses = ['فعال', 'در انتظار', 'بایگانی‌شده'];
    const names = ['لپ‌تاپ گیمینگ', 'کفش ورزشی', 'صندلی ارگونومیک', 'دستگاه اسپرسو', 'کنسول بازی'];

    this.mockDatabase = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      code: `PRD-${1000 + i}`,
      name: `${names[i % names.length]} (${i + 1})`,
      category: categories[i % categories.length],
      quantity: Math.floor(Math.random() * 100) + 1,
      status: statuses[i % statuses.length],
      price: Math.floor(Math.random() * 5000000 + 100000),
      createdDate: `1403/${(i % 12 + 1).toString().padStart(2, '0')}/${((i % 28) + 1).toString().padStart(2, '0')}`
    }));
  }
}
