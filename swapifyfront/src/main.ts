import { bootstrapApplication } from '@angular/platform-browser';
import { LoginComponent } from './app/login/login.component';

bootstrapApplication(LoginComponent)
  .catch((err) => console.error(err));
