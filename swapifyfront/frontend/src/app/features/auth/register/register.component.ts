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
  username: string = ''; // Cambiado a string para almacenar el nombre de usuario
  email: string = '';
  password: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  confirmPassword: string = ''; // Cambiado a booleano para controlar el checkbox

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    console.log('onSubmit ejecutado', this.email, this.password);
    this.error = null;
    this.successMessage = null;
  
    // Validar campos vacíos
    if (!this.email || !this.password || !this.confirmPassword) {
      this.error = 'Por favor, complete todos los campos.';
      console.log('Campos incompletos');
      return;
    }
  
    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas deben coincidir.';
      console.log('Las contraseñas no coinciden');
      alert('Las contraseñas no coinciden. Por favor, verifica e inténtalo de nuevo.');
      return;
    }
  
    const registerData = {
      email: this.email,
      password: this.password,
      username : this.username,
    };
  
    console.log('Enviando datos:', registerData);
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        this.email = '';
        this.username = ''; // Limpiar el campo de nombre de usuario
        this.password = '';
        this.confirmPassword = ''; // Limpiar el campo de confirmación
        this.router.navigate(['/login']);
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