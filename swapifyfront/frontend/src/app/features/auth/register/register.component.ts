import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink], // Mantengo RouterLink por si añades navegación
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    console.log('onSubmit ejecutado', this.email, this.password);
    this.error = null;
    this.successMessage = null;
  
    if (!this.email || !this.password) {
      this.error = 'Por favor, complete todos los campos.';
      console.log('Campos incompletos');
      return;
    }
  
    const registerData = {
      email: this.email,
      password: this.password
    };
  
    console.log('Enviando datos:', registerData);
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        this.email = '';
        this.password = '';
        this.router.navigate(['/login']);
        /*setTimeout(() => {
        }, 500);*/ 
        //TODO spinner
      },
      error: (err) => {
        console.log('Error del backend:', err);
        this.error = 'Error al registrar: ' + (err.error?.message || 'Inténtalo de nuevo.');
      }
    });
  }
  irAMain() {
    this.router.navigate(['/main']);
  }
}