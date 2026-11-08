import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './shared/header/app-header.component';
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    AppHeaderComponent,
    TuiRoot
  ],
  template: `
    <tui-root>
      <app-header></app-header>
      <router-outlet></router-outlet>
    </tui-root>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Мое Angular-приложение';
}