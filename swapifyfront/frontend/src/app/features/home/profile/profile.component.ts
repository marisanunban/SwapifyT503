import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../services/user-service/user.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { CloudinaryService } from '../../../services/cloudinary-service/cloudinary.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: { id: number; username: string; credits: number } | null = null;
  username: string = '';
  aboutMe: string = '';
  profileImageUrl: string = ''; // Base64 de la imagen
  isEditing: boolean = false;
  isEditingMe: boolean = false;
  products: any[] = [];
  latitude: number | null = null;
  longitude: number | null = null;
  municipio: string | null = null;
  pais: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user; // Se actualizará automáticamente cuando el usuario inicie sesión
    });

    const token = localStorage.getItem('token');
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: response => {
          this.username = response.username;
          this.aboutMe = response.aboutMe;
          this.profileImageUrl = response.profilePicture;
          this.recuperarProductosPropietario(); // Llama a la función para recoger productos
        },
        error: error => {
          console.error('Error al obtener perfil:', error);
        }
      });
    } else {
      console.error('No hay token disponible.');
    }

    // Obtener la ubicación del usuario
    this.obtenerUbicacion();
  }

  obtenerUbicacion(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          console.log(`Ubicación obtenida: Latitud ${this.latitude}, Longitud ${this.longitude}`);
          this.obtenerMunicipio(); // Llama al método para obtener el municipio y el país
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    } else {
      console.error('La geolocalización no es compatible con este navegador.');
    }
  }

  obtenerMunicipio(): void {
    if (this.latitude && this.longitude) {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${this.latitude}&lon=${this.longitude}&format=json`;

      this.http.get<any>(url).subscribe({
        next: (response) => {
          console.log('Respuesta de Nominatim:', response);
          // Extraer municipio y país de la respuesta
          this.municipio = response.address.city || response.address.town || response.address.village || 'Municipio no encontrado';
          this.pais = response.address.country || 'País no encontrado';
          console.log(`Municipio: ${this.municipio}`);
          console.log(`País: ${this.pais}`);
        },
        error: (error) => {
          console.error('Error al obtener el municipio y el país:', error);
        }
      });
    } else {
      console.error('Latitud o longitud no están definidas.');
    }
  }

  enableEditing() {
    this.isEditing = true;
  }

  enableEditingMe() {
    this.isEditingMe = true;
  }

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

  saveProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }

    const updatedProfile: any = {};

    if (this.profileImageUrl) {
      updatedProfile.profilePicture = this.profileImageUrl; // Imagen en base64
    }

    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        console.log('Perfil actualizado:', response);
        setTimeout(() => {
          this.isEditing = false;
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

    if (this.aboutMe) {
      updatedProfile.aboutMe = this.aboutMe;
    }

    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        console.log('Perfil actualizado:', response);
        setTimeout(() => {
          this.isEditingMe = false;
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
      this.productService.getAllProducts(token).subscribe({
        next: response => {
          this.products = response;
          console.log('Productos:', this.products);
        },
        error: error => {
          console.error('Error al obtener productos:', error);
        }
      });
    }
  }

  recuperarProductosPropietario() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id) {
      this.productService.getProductsByOwner(this.user.id, token).subscribe({
        next: (response) => {
          console.log('Respuesta completa del bckend:', response);
          this.products = response.map((product: any) => {
            return {
              ...product,
              imageUrl: product.imageUrl,
              imageId: product.imageId
            };
          });
          console.log('Productos del propietario:', this.products);
        },
        error: (error) => {
          console.error('Error al obtener productos del propietario:', error);
        }
      });
    } else {
      console.error('No hay token o ID de usuario disponible.');
    }
  }

  eliminarProducto(productId: string, imageId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }

    this.cloudinaryService.deleteImage(imageId).subscribe({
      next: () => {
        this.productService.deleteProduct(productId, token).subscribe({
          next: () => {
            this.recuperarProductosPropietario();
          },
          error: error => {
            console.error('Error al eliminar el producto:', error);
          }
        });
      },
      error: error => {
        console.error('Error al eliminar la imagen de Cloudinary:', error);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/main']);
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  irAProfile() {
    this.router.navigate(['/profile']);
  }

  irAContacta() {
    this.router.navigate(['/contact']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irACrear() {
    this.router.navigate(['/create']);
  }

  irAEditar(productId: string): void {
    this.router.navigate(['/edit', productId]);
  }
}