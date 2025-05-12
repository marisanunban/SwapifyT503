import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainComponent } from './features/home/main/main.component';
import { ProfileComponent } from './features/home/profile/profile.component';
import { CreateProductComponent } from './features/home/products/create-product/create-product.component';
import { ContactComponent } from './features/home/contact/contact.component';
import { EditProductComponent } from './features/home/products/edit-product/edit-product.component';
import { ChatComponent } from './features/home/chat/chat.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { NavigationProfileComponent } from './features/home/navigation-profile/navigation-profile.component';

export const routes: Routes = [
  {path: 'main' , component: MainComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' }, 
  {
    path: 'home', redirectTo: '/main', pathMatch: 'full'
  },
  {path: 'profile', component: ProfileComponent},
  {path: 'create', component: CreateProductComponent},
  {path: 'edit/:id', component: EditProductComponent},
  {path: 'contact', component: ContactComponent},
  {path: 'chat', component: ChatComponent},
  {path: 'resetPassword', component: ResetPasswordComponent},
  {path: 'viewOtherUser/:userEmail', component: NavigationProfileComponent},
  
];