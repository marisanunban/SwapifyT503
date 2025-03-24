import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Para ngIf
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  user: { email: string; credits: number } | null = null;
  constructor(private router: Router, private authService: AuthService) {}
  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user; // Se actualizará automáticamente cuando el usuario inicie sesión
    });
  }

  logout() {
    this.authService.logout();
  }
  irARegistro() {
    this.router.navigate(['/register']);
  }
  irALogin() {
    this.router.navigate(['/login']);
  }
}