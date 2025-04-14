import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  user: { id: number; username: string; credits: number } | null = null;
  products: any[] = []; 

  constructor(private router: Router, private authService: AuthService, private productService: ProductService) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user; // Se actualizará automáticamente cuando el usuario inicie sesión
    });
    this.recogerProductos(); // Llama a recogerProductos independientemente del estado de inicio de sesión
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/main']); // Redirigir al login después de cerrar sesión
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

  irAContacta() {
    this.router.navigate(['/contact']);
  }
 

  recogerProductos() {
    this.productService.getAllProducts().subscribe({
      next: response => {
        this.products = response; // Asignar la respuesta a la variable products
        console.log('Productos:', this.products); // Para verificar qué se recibe realmente
      },
      error: error => {
        console.error('Error al obtener productos:', error);
      }
    });
  }
}