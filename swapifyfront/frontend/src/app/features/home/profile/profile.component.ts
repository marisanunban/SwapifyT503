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
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: { id: number; username: string; credits: number } | null = null;
  username: string = '';
  aboutMe: string = '';
  profileImageUrl: string = '';
  imageFile: File | null = null;
  isEditing: boolean = false;
  isEditingMe: boolean = false;
  products: any[] = [];
  conversations: any[] = [];
  otherUserNames: { [conversationId: number]: string } = {};
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
    private http: HttpClient,
    private negotiationService: NegotiationService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    const token = localStorage.getItem('token');
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: response => {
          this.username = response.username;
          this.aboutMe = response.aboutMe;
          this.profileImageUrl = response.profilePicture;
          this.recuperarProductosPropietario();
        },
        error: error => {
          console.error('Error al obtener perfil:', error);
        }
      });
    } else {
      console.error('No hay token disponible.');
    }

    this.obtenerUbicacion();
  }

  recuperarConversaciones() {
    const token = localStorage.getItem('token');
    if (!token || !this.user?.id) {
      console.error('No hay token o usuario disponible.');
      return;
    }

    this.negotiationService.getUserConversations().subscribe({
      next: (response) => {
        this.conversations = response;
        this.conversations.forEach(conv => {
          const otherUserId = conv.buyerId === this.user!.id ? conv.sellerId : conv.buyerId;
          this.userService.getUserById(otherUserId, token).subscribe({
            next: (userInfo) => {
              this.otherUserNames[conv.id] = userInfo.username || `Usuario ${otherUserId}`;
            },
            error: () => {
              this.otherUserNames[conv.id] = `Usuario ${otherUserId}`;
            }
          });
        });
        this.products = this.products.map(product => {
          const conversation = this.conversations.find(conv => 
            (conv.sellerId === this.user!.id && conv.buyerId !== this.user!.id) ||
            (conv.buyerId === this.user!.id && conv.sellerId === product.ownerId)
          );
          return { ...product, conversation };
        });
      },
      error: (error) => {
        console.error('Error al obtener conversaciones:', error);
      }
    });
  }

  goToChat(conversationId: number) {
    this.router.navigate(['/chat'], {
      state: { conversationId }
    });
  }

  deleteConversation(conversationId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      this.negotiationService.deleteConversation(conversationId, token).subscribe({
        next: () => {
          console.log('Conversación eliminada:', conversationId);
          this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
          delete this.otherUserNames[conversationId];
          // Actualizar productos para quitar la referencia a la conversación eliminada
          this.products = this.products.map(product => {
            if (product.conversation && product.conversation.id === conversationId) {
              const { conversation, ...rest } = product;
              return rest;
            }
            return product;
          });
        },
        error: (error) => {
          console.error('Error al eliminar la conversación:', error);
          alert('No se pudo eliminar la conversación. Inténtalo de nuevo.');
        }
      });
    }
  }

  obtenerUbicacion(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.obtenerMunicipio();
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
          this.municipio = response.address.city || response.address.town || response.address.village || 'Municipio no encontrado';
          this.pais = response.address.country || 'País no encontrado';
        },
        error: (error) => {
          console.error('Error al obtener el municipio y el país:', error);
        }
      });
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
      this.imageFile = input.files[0];
    }
  }

  saveProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }

    if (this.imageFile) {
      this.cloudinaryService.uploadImage(this.imageFile, token).subscribe({
        next: (uploadResponse) => {
          this.profileImageUrl = uploadResponse.imageUrl;
          this.updateProfile(token);
        },
        error: (error) => {
          console.error('Error al subir la imagen:', error);
        }
      });
    } else {
      this.updateProfile(token);
    }
  }

  private updateProfile(token: string): void {
    const updatedProfile: any = {
      profilePictureUrl: this.profileImageUrl
    };

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
          this.products = response.map((product: any) => ({
            ...product,
            imageUrl: product.imageUrl,
            imageId: product.imageId
          }));
          this.recuperarConversaciones();
        },
        error: (error) => {
          console.error('Error al obtener productos del propietario:', error);
        }
      });
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