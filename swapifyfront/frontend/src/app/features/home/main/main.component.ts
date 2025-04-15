import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';

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
  search: boolean = false;
  searchKeyword: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private negotiationService: NegotiationService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.user = user;
    });
    this.recogerProductos();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/main']);
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
      next: (response) => {
        this.products = response;
        console.log('Productos:', this.products);
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      }
    });
  }

  buscarProductos() {
    if (this.searchKeyword.length === 0) {
      this.search = false;
      this.recogerProductos();
      return;
    } else if (this.searchKeyword.length < 4) {
      console.error('El término de búsqueda debe tener al menos 4 caracteres.');
      return;
    }

    this.productService.searchProducts(this.searchKeyword).subscribe({
      next: (response) => {
        this.products = response;
        this.search = true;
      },
      error: (error) => {
        console.error('Error al buscar productos:', error);
        this.products = [];
        this.search = true;
      }
    });
  }

  startChat(productId: string) {
    const token = localStorage.getItem('token');
    if (!this.user || !token) {
      console.warn('Usuario no autenticado. Redirigiendo a login.');
      this.router.navigate(['/login']);
      return;
    }

    this.negotiationService.startNegotiation(productId).subscribe({
      next: (conversation) => {
        console.log('Conversación iniciada:', conversation);
        this.router.navigate(['/chat'], { state: { conversationId: conversation.id } });
      },
      error: (error) => {
        console.error('Error al iniciar la conversación:', error);
      }
    });
  }
}