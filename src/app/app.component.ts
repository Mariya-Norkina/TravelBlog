import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './shared/header/app-header.component';

@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>  
  `,
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, AppHeaderComponent]
})
export class AppComponent {
  title = 'Мое Angular-приложение';
}