// login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';
import { ResetPasswordService } from '../../../services/reset-password/reset-password.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  resetPassword: boolean = false;
  resetToken: string = '';
  newPassword: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private resetPasswordService: ResetPasswordService,
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
        console.log(response);
        const token = response.message.split(': ')[1]; // Extrae el token
        console.log('Token extraído:', token);

        localStorage.setItem('token', token);

        this.successMessage = '¡Login exitoso! Creando usuario...';
        this.email = '';
        this.password = '';

        // Llamada a /api/users/create
        this.userService.create(token).subscribe({
          next: (userInfo) => {
            console.log('Usuario creado/recuperado:', userInfo);
            // Actualizamos el usuario en el AuthService
            this.authService.updateUser({
              id: userInfo.id,
              username: userInfo.username,
              credits: userInfo.credits
            });
            this.successMessage = '¡Usuario creado! Redirigiendo a home...';
            setTimeout(() => {
              this.router.navigate(['/home']);
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

  enviarSolicitudReset() {
    this.resetPasswordService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        console.log('Correo de reseteo enviado:', response.message);
        this.successMessage = 'Correo enviado. Revisa tu bandeja de entrada.';
        this.error = null;
      },
      error: (err) => {
        console.error('Error al solicitar reset:', err);
        this.error = 'No se pudo enviar el correo de recuperación.';
      }
    });
  }
  confirmarReset() {
    this.resetPasswordService.confirmPasswordReset(this.resetToken, this.newPassword).subscribe({
      next: (response) => {
        console.log('Contraseña cambiada:', response.message);
        this.successMessage = 'Contraseña cambiada exitosamente. Ya podés iniciar sesión.';
        this.resetPassword = false;
        this.error = null;
        this.email = '';
        this.password = '';
      },
      error: (err) => {
        console.error('Error al confirmar reset:', err);
        this.error = 'Token inválido o expirado.';
      }
    });
  }
    

  onResetPassword() {
    this.resetPassword = true;
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
  irAMain() {
    this.router.navigate(['/main']);
  }
}