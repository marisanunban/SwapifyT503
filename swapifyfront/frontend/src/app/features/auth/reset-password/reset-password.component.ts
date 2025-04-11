import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    if (this.newPassword !== this.confirmPassword) {
      console.error('Las contraseñas no coinciden.');
      return;
    }

    const token = this.getTokenFromUrl(); // Obtén el token del enlace de restablecimiento
    const payload = { password: this.newPassword };

    this.http.post(`/api/auth/reset-password?token=${token}`, payload).subscribe({
      next: () => {
        console.log('Contraseña restablecida exitosamente.');
        this.router.navigate(['/login']); // Redirige al login
      },
      error: (error) => {
        console.error('Error al restablecer la contraseña:', error);
      }
    });
  }

  private getTokenFromUrl(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token') || '';
  }
}