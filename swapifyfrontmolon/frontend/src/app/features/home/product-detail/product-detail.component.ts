import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductService } from '../../../services/product-service/product.service';
import { Product } from '../../../models/product.model';
import { UserService } from '../../../services/user-service/user.service';
import { UserProfile } from '../../../models/user.model';

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
  owner: UserProfile | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private userService: UserService,
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
          console.log('Producto cargado:', product);
          this.product = product;
          if (product.ownerId) {
            console.log('Solicitando perfil del propietario con ownerId:', product.ownerId);
            this.userService.getUserById(product.ownerId, this.token!).subscribe({
              next: (owner: UserProfile) => {
                console.log('Propietario cargado:', owner);
                this.owner = owner;
                console.log('Nickname del propietario:', owner.nickname);
              },
              error: (error: HttpErrorResponse) => {
                console.error('Error al cargar el perfil del propietario:', error.message, error.status, error.error);
                this.owner = null;
              }
            });
          } else {
            console.error('El producto no tiene ownerId:', product);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al cargar los detalles del producto:', error.message, error.status, error.error);
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

  goToOwnerProfile(): void {
    if (this.owner && this.owner.nickname && this.owner.nickname.trim()) {
      console.log('Navegando al perfil del propietario:', this.owner.nickname);
      this.router.navigate([`/viewOtherUser/${this.owner.nickname}`]);
    } else {
      console.error('No se pudo encontrar un nickname válido del propietario:', this.owner);
      alert('No se puede acceder al perfil del propietario en este momento.');
    }
  }
}