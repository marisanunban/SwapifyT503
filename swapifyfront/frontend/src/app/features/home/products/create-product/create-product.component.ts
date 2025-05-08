import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product-service/product.service';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../../services/transaction-service/transaction.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent {
  title = '';
  category = '';
  description = '';
  price = 0;
  imageFile: File | null = null;
  token = '';

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private cloudinaryService: CloudinaryService,
    public router: Router
  ) {}

  ngOnInit(): void {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    } else {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
    }
  }

  createProduct(): void {
    if (!this.title || !this.category || !this.description || this.price <= 0 || !this.imageFile) {
      console.error('Todos los campos son obligatorios, incluida la imagen.');
      return;
    }

    this.cloudinaryService.uploadImage(this.imageFile, this.token).subscribe({
      next: (uploadResponse) => {
        console.log('Imagen subida exitosamente:', uploadResponse);

        const productData = {
          title: this.title,
          category: this.category,
          description: this.description,
          price: this.price,
          imageUrl: uploadResponse.imageUrl,
          imageId: uploadResponse.publicId
        };

        this.productService.createProduct(productData, this.token).subscribe({
          next: (response) => {
            console.log('Producto creado exitosamente:', response);

            // Crear la transacción después de crear el producto
            const productId = response.id; // Usar response.id directamente como string
            this.transactionService.createTransaction(productId, 0).subscribe({
              next: (transactionResponse) => {
                console.log('Transacción creada exitosamente:', transactionResponse);
                this.router.navigate(['/main']);
              },
              error: (transactionError) => {
                console.error('Error al crear la transacción:', transactionError);
              }
            });
          },
          error: (error) => {
            console.error('Error al crear el producto:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error al subir la imagen:', error);
        if (error.status == 403) {
          alert('Error 403: ' + error.error.error);
        }
      }
    });
  }
}