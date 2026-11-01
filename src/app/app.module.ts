import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AppHeaderComponent } from './shared/header/app-header.component';

import { HomeComponent } from './pages/home/home.component';


@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    
    HomeComponent,
    AppComponent,
    MainLayoutComponent,
    AuthLayoutComponent,
    LoginComponent,
    RegisterComponent,
    AppHeaderComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}