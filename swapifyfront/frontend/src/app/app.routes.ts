import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainComponent } from './features/home/main/main.component';
import { ProfileComponent } from './features/home/profile/profile.component';
import { CreateProductComponent } from './features/home/create-product/create-product.component';

export const routes: Routes = [
  {path: 'main' , component: MainComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' }, 
  {
    path: 'home',
    component: MainComponent
  },
  {path: 'profile', component: ProfileComponent},
  {path: 'create', component: CreateProductComponent}
];