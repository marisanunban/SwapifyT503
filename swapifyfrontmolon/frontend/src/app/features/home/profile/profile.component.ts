import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
import { TransactionService } from '../../../services/transaction-service/transaction.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

interface UserProfile {
  id: number;
  username: string;
  credits: number;
  locationName?: string;
  nickname?: string;
  aboutMe?: string;
  profilePicture?: string;
}
export interface Transaction {
  id: number;
  sellerId: number;
  buyerId: number;
  productOfferedId: string;
  productRequestedId: string;
  creditsOffered: number;
  creditsRequested: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
  isProcessing: boolean;
  conversationId: number;
}


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule,NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  nickname: string = '';
  aboutMe: string = '';
  profileImageUrl: string = '';
  imageFile: File | null = null;
  isEditing: boolean = false;
  isEditingMe: boolean = false;
  isEditingUsername: boolean = false;
  products: any[] = [];
  conversations: any[] = [];
  otherUserNames: { [conversationId: number]: string } = {};
  latitude: number | null = null;
  longitude: number | null = null;
  municipio: string | null = null;
  pais: string | null = null;
  mostrarSeccionProductos: boolean = true;
  showReviewModal: boolean = false;
  purchasedProducts: any[] = [];
  isProfileMenuOpen: boolean = false;
  reviewableProducts: any[] = []; // Productos que pueden recibir reseñas
  currentPage: number = 1; // Página actual
  itemsPerPage: number = 4; // Número de productos por página

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private http: HttpClient,
    private negotiationService: NegotiationService,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user || null;
    });

    const token = localStorage.getItem('token');
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: response => {
          this.user = {
            id: response.id,
            username: response.username,
            credits: response.credits,
            locationName: response.locationName || '',
            nickname: response.nickname || '',
            aboutMe: response.aboutMe || '',
            profilePicture: response.profilePicture || ''
          };
          this.nickname = this.user.nickname || '';
          this.aboutMe = this.user.aboutMe || '';
          this.profileImageUrl = this.user.profilePicture || '';
          this.recuperarProductosPropietario();
          this.loadReviewableProducts(); // Cargar productos que pueden recibir reseñas
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

  get paginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products.slice(startIndex, endIndex);
  }
  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.products.length / this.itemsPerPage) }, (_, i) => i + 1);
  }



  toggleReviewModal() {
    this.showReviewModal = !this.showReviewModal;
  }
  
  writeReview(productId: number) {
    // Esta es una función de marcador de posición - la implementarás más tarde
    this.router.navigate(['/createReview/', productId]);
    console.log('Writing review for product ID:', productId);
  }
  openReviewModal() {
    this.showReviewModal = true;
  }



  mostrarProductos(): void {
    this.mostrarSeccionProductos = true;
    this.recuperarProductosPropietario();
  }

  mostrarConversaciones(): void {
    this.mostrarSeccionProductos = false;
    this.recuperarConversaciones();
  }

  recuperarConversaciones() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id) {
      this.negotiationService.getUserConversations().subscribe({
        next: (response) => {
          this.conversations = response;
          console.log('Conversaciones del usuario:', this.conversations);
          this.products = this.products.map(product => ({
            ...product,
            conversation: this.conversations.find(conv => conv.productId === product.id && conv.status === 'ACTIVE')
          }));
        },
        error: (error) => {
          console.error('Error al obtener conversaciones:', error);
        }
      });
    } else {
      console.error('No hay token o ID de usuario disponible.');
    }
  }

  goToChat(conversationId: number) {
    this.router.navigate(['/chat'], {
      state: { conversationId }
    });
  }

  deleteConversation(conversationId: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      this.negotiationService.deleteConversation(conversationId).subscribe({
        next: () => {
          console.log('Conversación eliminada:', conversationId);
          this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
          delete this.otherUserNames[conversationId];
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

  updateLocation(): void {
    const token = localStorage.getItem('token');
    if (!token || !this.user?.id) {
      console.error('No hay token o ID de usuario disponible.');
      return;
    }

    if (this.latitude && this.longitude && this.municipio) {
      const payload = { latitude: this.latitude, longitude: this.longitude, locationName: this.municipio };
      this.userService.updateUserLocation(this.user.id, payload, token).subscribe({
        next: (response) => {
          console.log('Ubicación actualizada:', response);
          if (this.user) {
            this.user = { ...this.user, locationName: this.municipio } as UserProfile; // Casteo explícito
          }
          alert('Ubicación actualizada correctamente.');
        },
        error: (error) => {
          console.error('Error al actualizar la ubicación:', error);
          alert('No se pudo actualizar la ubicación. Inténtalo de nuevo.');
        }
      });
    } else {
      console.error('No se pudo obtener la ubicación completa.');
      alert('No se pudo obtener la ubicación completa. Por favor, inténtalo de nuevo.');
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
          if (error.status == 403) {
            alert('Error 403: ' + error.error.error);
          }
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

  toggleEditUsername() {
    this.isEditingUsername = true;
  }

  updateUsername() {
    if (!this.nickname.trim()) {
      console.warn('El nombre de usuario no puede estar vacío.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró el token de autenticación.');
      return;
    }

    const profileData = { nickname: this.nickname };
    console.log('Datos del perfil a actualizar:', profileData);

    this.userService.updateUserProfile(token, profileData).subscribe({
      next: (response) => {
        console.log('Nombre de usuario actualizado:', response);
        this.isEditingUsername = false;
      },
      error: (error) => {
        console.error('Error al actualizar el nombre de usuario:', error);
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



  loadReviewableProducts() {
    if (!this.user || !this.user.id) {
      console.error('El usuario no está definido o no tiene un ID.');
      return;
    }
  
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      return;
    }
  
    const userId = this.user.id;
    const productIdsToReview: string[] = [];
  
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        const completedTransactionsObservables = products.map((product: any) =>
          this.transactionService.getCompletedTransactionsBetweenUsers(userId, product.ownerId).pipe(
            map((transactions) => {
              // Recorrer transacciones y recolectar productos que debe reseñar el usuario
              transactions.forEach((transaction) => {
                if (transaction.sellerId === userId && transaction.productRequestedId) {
                  productIdsToReview.push(transaction.productRequestedId);
                } else if (transaction.buyerId === userId && transaction.productOfferedId) {
                  productIdsToReview.push(transaction.productOfferedId);
                }
              });
              
  
              // Si este producto está entre los recibidos, devolverlo para reseña
              const shouldReview = productIdsToReview.includes(product.id.toString());
              return shouldReview ? product : null;
            }),
            catchError((error) => {
              console.error(`Error al obtener transacciones para el producto ${product.id}:`, error);
              return of(null);
            })
          )
        );
  
        forkJoin(completedTransactionsObservables).subscribe({
          next: (results) => {
            this.reviewableProducts = results.filter((product) => product !== null);
            console.log('Productos que puedes reseñar:', this.reviewableProducts);
          },
          error: (error) => {
            console.error('Error al verificar transacciones completadas:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      },
    });
  }
  
}
