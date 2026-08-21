import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TableEditComponent} from './components/table-edit/table-edit.component';
import {TableExportComponent} from './components/table-export/table-export.component';
import {TableSingleExportComponent} from './components/table-single-export/table-single-export.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableEditComponent, TableExportComponent, TableSingleExportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-sodoor';
}
