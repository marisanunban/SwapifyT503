import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product-service/product.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';

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

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit {
  title: string = '';
  category: string | undefined = '';
  description: string | undefined = '';
  price: number = 0;
  imageUrl: string | undefined = '';
  imageFile: File | null = null;
  token: string = '';
  productId: string | null = null;

  constructor(
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    } else {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
      return;
    }

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.productService.getProductById(this.productId, this.token).subscribe({
        next: (product) => {
          this.title = product.title;
          this.category = product.category; // Ahora compatible porque category es string | undefined
          this.description = product.description; // Compatible porque description es string | undefined
          this.price = product.price;
          this.imageUrl = product.imageUrl; // Compatible porque imageUrl es string | undefined
        },
        error: (error) => {
          console.error('Error al cargar el producto:', error);
          this.router.navigate(['/home']);
        }
      });
    } else {
      console.error('No se encontró el ID del producto en la URL');
      this.router.navigate(['/home']);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  editProduct(): void {
    if (!this.title || this.price <= 0) {
      console.error('El título y el precio son obligatorios, y el precio debe ser mayor a 0');
      return;
    }

    if (this.imageFile) {
      this.cloudinaryService.uploadImage(this.imageFile, this.token).subscribe({
        next: (uploadResponse) => {
          console.log('Imagen subida exitosamente:', uploadResponse);
          this.imageUrl = uploadResponse.imageUrl;
          console.log('imageFile', this.imageFile);
          console.log('imageUrl', this.imageUrl);
          this.updateProduct();
        },
        error: (error) => {
          console.error('Error al subir la imagen:', error);
        }
      });
    } else {
      this.updateProduct();
    }
  }

  private updateProduct(): void {
    const productData: Partial<Product> = {
      title: this.title,
      category: this.category || undefined, // Manejar undefined
      description: this.description || undefined, // Manejar undefined
      price: this.price,
      imageUrl: this.imageUrl || undefined // Manejar undefined
    };

    console.log('Datos del producto a actualizar:', productData);

    if (this.productId) {
      this.productService.updateProduct(this.productId, productData, this.token).subscribe({
        next: (response) => {
          console.log('Producto actualizado exitosamente:', response);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error al actualizar el producto:', error);
        }
      });
    } else {
      console.error('No se encontró el ID del producto en el componente');
    }
  }
}
