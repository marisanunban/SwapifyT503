import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // Para ngIf

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  onSubmit() {
    console.log('Iniciando login...');
    const loginData = {
      email: this.email,
      password: this.password
    };

    console.log('Enviando datos:', loginData);

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response.message);
        const token = response.message.split(': ')[1]; // Extrae el token
        console.log('Token extraído:', token);

        this.successMessage = '¡Login exitoso! Creando usuario...';
        this.email = '';
        this.password = '';

        // Llamada automática a /api/users/create
        this.userService.create(token).subscribe({
          next: (userInfo) => {
            console.log('Usuario creado/recuperado:', userInfo);
            this.successMessage = '¡Usuario creado! Redirigiendo a home...';
            setTimeout(() => {
              this.router.navigate(['/home']); // Cambiado de /main a /home
            }, 1000);
          },
          error: (err) => {
            console.log('Error al crear usuario:', err);
            this.error = 'Error al crear usuario: ' + (err.error?.message || 'Inténtalo de nuevo.');
          }
        });
      },
      error: (err) => {
        console.log('Error en login:', err);
        this.error = 'Error al iniciar sesión: ' + (err.error?.message || 'Credenciales inválidas.');
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
}