import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TableEditComponent} from './components/table-edit/table-edit.component';
import {TableExportComponent} from './components/table-export/table-export.component';
import {TableSingleExportComponent} from './components/table-single-export/table-single-export.component';
import {FileDownloadComponent} from './components/file-download/file-download.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableEditComponent, TableExportComponent, TableSingleExportComponent, FileDownloadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-sodoor';
}
