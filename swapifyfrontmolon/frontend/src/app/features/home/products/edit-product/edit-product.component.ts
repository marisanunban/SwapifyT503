import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product-service/product.service';
import { Product } from '../../../../models/product.model'; // Importar desde el archivo compartido
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit {
  product: Product = {
    id: 0,
    title: '',
    price: 0,
    description: '',
    imageUrl: [],
    ownerId: 0,
    category: '',
    imageId: []
  };
  productId: string | null = null;
  imageFiles: File[] = [];
  token: string | null = localStorage.getItem('token');

  constructor(
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private route: ActivatedRoute,
    public router: Router
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
        next: (data) => {
          this.product = { ...data };
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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFiles = Array.from(input.files).slice(0, 5);
      console.log('Archivos seleccionados:', this.imageFiles);
    }
  }

  editProduct(): void {
    if (!this.product.title || this.product.price <= 0) {
      console.error('El título y el precio son obligatorios, y el precio debe ser mayor a 0');
      return;
    }

    const productData: Partial<Product> = {
      title: this.product.title,
      category: this.product.category,
      description: this.product.description,
      price: this.product.price
    };

    if (this.imageFiles.length > 0) {
      const uploadPromises = this.imageFiles.map(file =>
        this.cloudinaryService.uploadImage(file, this.token!).toPromise()
      );

      Promise.all(uploadPromises)
        .then(uploadResponses => {
          productData.imageUrl = uploadResponses.map(response => response.imageUrl);
          productData.imageId = uploadResponses.map(response => response.publicId);

          this.updateProduct(productData);
        })
        .catch(error => {
          console.error('Error al subir las imágenes:', error);
        });
    } else {
      this.updateProduct(productData);
    }
  }

  private updateProduct(productData: Partial<Product>): void {
    if (this.productId) {
      this.productService.updateProduct(this.productId, productData, this.token!).subscribe({
        next: (response) => {
          console.log('Producto actualizado exitosamente:', response);
          this.router.navigate(['/profile']);
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