import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product-service/product.service';
import { Product } from '../../../models/product.model'; // Importar desde el archivo compartido

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  productId: string | null = null;
  token: string | null = localStorage.getItem('token');

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.token) {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
      return;
    }

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.productService.getProductById(this.productId, this.token).subscribe({
        next: (product) => {
          this.product = product;
        },
        error: (error) => {
          console.error('Error al cargar los detalles del producto:', error);
          this.router.navigate(['/home']);
        }
      });
    } else {
      console.error('No se encontró el ID del producto en la URL');
      this.router.navigate(['/home']);
    }
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}