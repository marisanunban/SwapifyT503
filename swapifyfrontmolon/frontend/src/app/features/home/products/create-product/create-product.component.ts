import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product-service/product.service';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../../services/transaction-service/transaction.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';
import { AuthService } from '../../../../services/auth-service/auth.service';

export interface Product {
  id: number;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ownerId: number;
  category?: string;
  imageId?: string;
  conversation?: { id: number };
}

export interface CreateProductDto {
  title: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  imageId: string;
  ownerId: number;
}

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnInit {
  productData: CreateProductDto = {
    title: '',
    category: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageId: '',
    ownerId: 0
  };
  imageFile: File | null = null;
  token: string | null = localStorage.getItem('token');

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    if (!this.token) {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener ownerId del usuario autenticado
    this.authService.user$.subscribe(user => {
      if (user) {
        this.productData.ownerId = user.id;
      } else {
        console.error('No se encontró el usuario autenticado');
        this.router.navigate(['/login']);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
    }
  }

  createProduct(): void {
    if (!this.productData.title || !this.productData.category || !this.productData.description || this.productData.price <= 0 || !this.imageFile) {
      console.error('Todos los campos son obligatorios, incluida la imagen.');
      return;
    }

    if (!this.productData.ownerId) {
      console.error('No se pudo obtener el ID del usuario');
      return;
    }

    this.cloudinaryService.uploadImage(this.imageFile, this.token!).subscribe({
      next: (uploadResponse) => {
        console.log('Imagen subida exitosamente:', uploadResponse);

        this.productData.imageUrl = uploadResponse.imageUrl;
        this.productData.imageId = uploadResponse.publicId;

        this.productService.createProduct(this.productData, this.token!).subscribe({
          next: (response) => {
            console.log('Producto creado exitosamente:', response);
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Error al crear el producto:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error al subir la imagen:', error);
        if (error.status === 403) {
          alert('Error 403: ' + error.error.error);
        }
      }
    });
  }
}