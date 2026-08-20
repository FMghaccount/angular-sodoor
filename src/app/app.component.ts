import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TableEditComponent} from './components/table-edit/table-edit.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableEditComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-sodoor';
}
