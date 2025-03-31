// main.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  user: { id: number; username: string; credits: number } | null = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user; // Se actualizará automáticamente cuando el usuario inicie sesión
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
  
  irAProfile() {
    this.router.navigate(['/profile']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
}