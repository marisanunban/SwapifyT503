import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnInit {
  productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicializa el formulario con validaciones
    this.productForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  createProduct(): void {
    const token = localStorage.getItem('token'); // Obtiene el token del localStorage

    if (!token) {
      console.error('No se encontró el token en el localStorage');
      return;
    }

    // Llama al método create del servicio
    this.productService.create(token).subscribe(
      (response) => {
        console.log('Producto creado:', response);
        this.router.navigate(['/productos']); // Redirige a la lista de productos
      },
      (error) => {
        console.error('Error al crear el producto:', error);
      }
    );
  }
}