import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product-service/product.service';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { TransactionService } from '../../../../services/transaction-service/transaction.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service'; // Importa el servicio de Cloudinary

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [FormsModule], // Asegúrate de incluir FormsModule aquí
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent {
  title = '';
  category = '';
  description = '';
  price = 0;
  imageFile: File | null = null; // Archivo de imagen seleccionado
  token = ''; // Aquí almacenarás el token del usuario

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private cloudinaryService: CloudinaryService,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Obtén el token del usuario desde el almacenamiento local o cualquier otro método
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    } else {
      console.error('No se encontró el token del usuario');
      // Redirige al usuario al login si no hay token
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
    // Validación básica para asegurarse de que todos los campos estén completos
    if (!this.title || !this.category || !this.description || this.price <= 0 || !this.imageFile) {
      console.error('Todos los campos son obligatorios, incluida la imagen.');
      return;
    }

    // Subir la imagen a Cloudinary
    this.cloudinaryService.uploadImage(this.imageFile, this.token).subscribe({
      next: (uploadResponse) => {
        console.log('Imagen subida exitosamente:', uploadResponse);

        // Construir los datos del producto con la URL de la imagen
        const productData = {
          title: this.title,
          category: this.category,
          description: this.description,
          price: this.price,
          imageUrl: uploadResponse.imageUrl, // URL de la imagen subida
          imageId: uploadResponse.publicId // ID de la imagen subida
        };

        // Llamada al servicio para crear el producto
        this.productService.createProduct(productData, this.token).subscribe({
          next: (response) => {
            console.log('Producto creado exitosamente:', response);

            // Crear la transacción después de crear el producto
            const productId = response.id; // Asegúrate de que el backend devuelva el ID del producto creado
            this.transactionService.createTransaction(productId, this.token).subscribe({
              next: (transactionResponse) => {
                console.log('Transacción creada exitosamente:', transactionResponse);
                this.router.navigate(['/main']); // Redirige al usuario a la página de inicio o donde prefieras
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
        if(error.status == 403){
          alert('Error 403: ' + error.error.error)
        }
      }
    });
  }
}