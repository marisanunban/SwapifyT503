import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product-service/product.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service'; // Importa el servicio de Cloudinary

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
  imageUrl: string = ''; // URL de la imagen actual
  imageFile: File | null = null; // Archivo de imagen seleccionado

  token = ''; // Token del usuario
  productId: string | null = null; // ID del producto a editar

  constructor(
    private productService: ProductService,
    private cloudinaryService: CloudinaryService, // Inyecta el servicio de Cloudinary
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
          this.imageUrl = product.imageUrl; // URL de la imagen actual
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
    }
  }

  editProduct(): void {
    // Validación básica para asegurarse de que todos los campos estén completos
    if (!this.title || !this.category || !this.description || this.price <= 0) {
      console.error('Todos los campos son obligatorios y el precio debe ser mayor a 0');
      return;
    }

    if (this.imageFile) {
      // Si se seleccionó una nueva imagen, súbela a Cloudinary
      this.cloudinaryService.uploadImage(this.imageFile, this.token).subscribe({
        
        next: (uploadResponse) => {
          console.log('Imagen subida exitosamente:', uploadResponse);
          this.imageUrl = uploadResponse.imageUrl; // Actualiza la URL de la imagen
          console.log("imeageFile", this.imageFile),
          console.log("imageUrl", this.imageUrl);
          this.updateProduct(); // Llama a la función para actualizar el producto
        },
        error: (error) => {
          console.error('Error al subir la imagen:', error);
        }
      });
    } else {
      // Si no se seleccionó una nueva imagen, actualiza directamente el producto
      this.updateProduct();
    }
  }

  private updateProduct(): void {
    const productData = {
      title: this.title,
      category: this.category,
      description: this.description,
      price: this.price,
      imageUrl: this.imageUrl // URL de la imagen actualizada o existente
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