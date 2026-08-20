import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import moment from 'jalali-moment';

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
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './table-edit.component.html',
  styleUrls: ['./table-edit.component.scss']
})
export class TableEditComponent implements OnInit {
  products: RowData[] = [];
  editForm!: FormGroup;
  addRowForm!: FormGroup;

  rowsPerPageOptions: number[] = [5, 10, 20];
  rows: number = 5;

  statusOptions: StatusOption[] = [
    { label: 'فعال', value: 'Active' },
    { label: 'در انتظار', value: 'Pending' },
    { label: 'غیرفعال', value: 'Inactive' }
  ];

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.products = [
      { id: 1, name: 'محصول الف', age: 25, status: 'Active', birthDate: moment('1378/03/22', 'jYYYY/jMM/jDD').toDate() },
      { id: 2, name: 'محصول ب', age: 34, status: 'Pending', birthDate: moment('1369/06/01', 'jYYYY/jMM/jDD').toDate() },
      { id: 3, name: 'محصول ج', age: 29, status: 'Active', birthDate: moment('1373/11/21', 'jYYYY/jMM/jDD').toDate() },
      { id: 4, name: 'محصول د', age: 41, status: 'Inactive', birthDate: moment('1362/08/13', 'jYYYY/jMM/jDD').toDate() }
    ];

    this.addRowForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(100)]],
      status: [null, [Validators.required]],
      birthDate: [null, [Validators.required]]
    });
  }

  onEditInit(field: string, currentValue: any): void {
    this.editForm = this.fb.group({
      [field]: [currentValue, this.getValidatorsForField(field)]
    });
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
      acceptButtonProps: { label: 'حذف', severity: 'danger' },
      rejectButtonProps: { label: 'انصراف', severity: 'secondary', outlined: true },
      accept: () => {
        this.products = this.products.filter((p) => p.id !== row.id);
      }
    });
  }

  logTableData(): void {
    const exportedData = this.products.map((item) => ({
      ...item,
      birthDateJalali: this.formatJalali(item.birthDate)
    }));
    console.table(exportedData);
    console.log('Raw Table Data:', this.products);
  }

  formatJalali(date: Date): string {
    if (!date) return '';
    return moment(date).locale('fa').format('jYYYY/jMM/jDD');
  }

  getStatusLabel(statusValue: string): string {
    const option = this.statusOptions.find((opt) => opt.value === statusValue);
    return option ? option.label : statusValue;
  }

  private getValidatorsForField(field: string) {
    switch (field) {
      case 'name': return [Validators.required, Validators.minLength(3)];
      case 'age': return [Validators.required, Validators.min(18), Validators.max(100)];
      case 'status': return [Validators.required];
      case 'birthDate': return [Validators.required];
      default: return [];
    }
  }
}
