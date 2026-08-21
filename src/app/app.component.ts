import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TableEditComponent} from './components/table-edit/table-edit.component';
import {TableExportComponent} from './components/table-export/table-export.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableEditComponent, TableExportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-sodoor';
}
