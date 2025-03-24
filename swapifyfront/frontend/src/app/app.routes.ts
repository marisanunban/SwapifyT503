import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainComponent } from './features/home/main/main.component';

export const routes: Routes = [
  {path: 'main' , component: MainComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' }, 
  {
    path: 'home',
    component: MainComponent
  }
];