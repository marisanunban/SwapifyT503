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
  search: boolean = false; 
  searchKeyword: string = ''; // Nueva propiedad para el término de búsqueda

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

  buscarProductos() {
    if (this.searchKeyword.length == 0) {
      this.search= false; // Indica que no se realizó una búsqueda
      this.recogerProductos(); // Si el término de búsqueda está vacío, vuelve a cargar todos los productos
      return;
    }
    else if(this.searchKeyword.length < 4) {
      console.error('El término de búsqueda debe tener al menos 4 caracteres.');
      return;
    } 

    this.productService.searchProducts(this.searchKeyword).subscribe({
      next: response => {
        this.products = response; // Asigna los productos encontrados
        this.search = true; // Indica que se realizó una búsqueda
      },
      error: error => {
        console.error('Error al buscar productos:', error);
        this.products = []; // Limpia los productos en caso de error
        this.search = true;
      }
    });
  }
}