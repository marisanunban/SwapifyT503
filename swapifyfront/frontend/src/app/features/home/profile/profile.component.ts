import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { switchMap } from 'rxjs';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user: { id: number; username: string; credits: number } | null = null;
  username: string = '';
  aboutMe: string = '';
  profileImageUrl: string = ''; // Base64 de la imagen
  isEditing: boolean = false;
  isEditingMe: boolean = false;
  products: any[] = []; 

  constructor(private router: Router, private userService: UserService, private authService: AuthService, private productService: ProductService) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user; // Se actualizará automáticamente cuando el usuario inicie sesión
    });

    const token = localStorage.getItem('token');
    console.log(token);
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: response => {
          this.username = response.username;
          this.aboutMe = response.aboutMe;
          this.profileImageUrl = response.profilePicture;
          this.recogerProductos(); // Llama a la función para recoger productos
        },
        error: error => {
          console.error('Error al obtener perfil:', error);
        }
      });
    } else {
      console.error('No hay token disponible.');
    }
  }

  enableEditing() {
    this.isEditing = true;
  }

  enableEditingMe() {
    this.isEditingMe = true;
  }

  // Método para manejar la selección de archivo y convertirlo a base64
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
  
      reader.onload = () => {
        this.profileImageUrl = reader.result as string; // Guarda la imagen en base64
        console.log('Imagen en base64:', this.profileImageUrl); // Verifica el valor
      };
  
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
      };
  
      reader.readAsDataURL(file); // Convierte la imagen a base64
    }
  }
//TODO: ARREGLAR LA IMAGEN DE PERFIL
  saveProfile() {
    const token = localStorage.getItem('token');
    console.log(token);
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }
  
    const updatedProfile: any = {};
  
    // Agregar solo los campos modificados
    if (this.profileImageUrl) {
      updatedProfile.profilePicture = this.profileImageUrl; // Imagen en base64
    }
  
    console.log(updatedProfile); // Para verificar qué se envía realmente
  
    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        console.log('Perfil actualizado:', response);
        setTimeout(() => {
          this.isEditing = false; // 🔹 Cierra la edición después de actualizar
        }, 0);
      },
      error: error => {
        console.error('Error al actualizar perfil:', error);
        setTimeout(() => {
          this.isEditing = false;
        }, 0);
      }
    });
  }

  saveProfileAbout() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }
  
    const updatedProfile: any = {};
  
    // Agregar solo los campos modificados
    console.log(this.aboutMe);
    if (this.aboutMe) {
      updatedProfile.aboutMe = this.aboutMe;
    }
  
    console.log(updatedProfile); // Para verificar qué se envía realmente
  
    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        console.log('Perfil actualizado:', response);
        setTimeout(() => {
          this.isEditingMe = false; // 🔹 Cierra la edición después de actualizar
        }, 0);
      },
      error: error => {
        console.error('Error al actualizar perfil:', error);
        setTimeout(() => {
          this.isEditingMe = false;
        }, 0);
      }
    });
  }

  recogerProductos() {
    const token = localStorage.getItem('token');
    if (token) {
      this.productService.getProductsByUser(token).subscribe({
        next: response => {
          this.products = response; // Asignar la respuesta a la variable products
          console.log('Productos:', this.products); // Para verificar qué se recibe realmente
        },
        error: error => {
          console.error('Error al obtener productos:', error);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }
  
  irAProfile() {
    this.router.navigate(['/profile']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irACrear() {
    this.router.navigate(['/create']);
  }
}