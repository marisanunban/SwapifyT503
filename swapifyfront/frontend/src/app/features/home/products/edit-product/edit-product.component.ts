import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-edit-product',
  standalone: true, // Indica que este componente es standalone
  imports: [CommonModule, FormsModule], // Importa FormsModule aquí
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit {
  title = '';
  category = '';
  description = '';
  price = 0;

  token = ''; // Token del usuario
  productId: string | null = null; // ID del producto a editar

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el token del usuario desde el almacenamiento local
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    } else {
      console.error('No se encontró el token del usuario');
      // Redirige al usuario al login si no hay token
      this.router.navigate(['/login']);
      return;
    }

    // Obtener el ID del producto desde la URL
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      // Llamar al servicio para obtener los datos del producto
      this.productService.getProductById(this.productId, this.token).subscribe({
        next: (product) => {
          // Asignar los datos del producto a las propiedades del componente
          this.title = product.title;
          this.category = product.category;
          this.description = product.description;
          this.price = product.price;
        },
        error: (error) => {
          console.error('Error al cargar el producto:', error);
          // Redirige al usuario a la página de inicio si ocurre un error
          this.router.navigate(['/home']);
        }
      });
    } else {
      console.error('No se encontró el ID del producto en la URL');
      // Redirige al usuario a la página de inicio si no hay ID
      this.router.navigate(['/home']);
    }
  }

  editProduct(): void {
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

    console.log('Datos del producto a actualizar:', productData);

    if (this.productId) {
      // Llamada al servicio para actualizar el producto
      this.productService.updateProduct(this.productId, productData, this.token).subscribe({
        next: (response) => {
          console.log('Producto actualizado exitosamente:', response);
          this.router.navigate(['/home']); // Redirige al usuario a la página de inicio
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