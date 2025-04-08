import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { TransactionService } from '../../../../services/transaction.service';

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

  token = ''; // Aquí almacenarás el token del usuario

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
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

  createProduct(): void {
    // Validación básica para asegurarse de que todos los campos estén completos
    if (!this.title || !this.category || !this.description || this.price <= 0) {
      console.error('Todos los campos son obligatorios y el precio debe ser mayor a 0');
      return;
    }

    // Construir los datos del producto a partir de las propiedades individuales
    const productData = {
      title: this.title,
      category: this.category,
      description: this.description,
      price: this.price
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
            this.router.navigate(['/home']); // Redirige al usuario a la página de inicio o donde prefieras
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
  }
}