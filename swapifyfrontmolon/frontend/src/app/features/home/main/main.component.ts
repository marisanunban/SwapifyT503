import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Product, Conversation } from '../../../models/product.model';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';
import { UserProfile, UserDto } from '../../../models/user.model'; // Import UserProfile and UserDto

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  searchKeyword: string = '';
  selectedCategory: string = '';
  search: boolean = false;
  searchCategory: boolean = false;
  isLoading: boolean = false;
  products: Product[] = [];
  user: UserDto | null = null; // Changed to UserDto
  isProfileMenuOpen: boolean = false;
  isLocationModalOpen: boolean = false;
  radius: number = 10;
  latitude: number | undefined;
  longitude: number | undefined;

  // Nuevas propiedades para las secciones
  recentlyViewed: Product[] = [];
  similarProducts: Product[] = [];

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar usuario
    this.authService.user$.subscribe(user => {
      this.user = user as UserDto | null; // Changed to UserDto
      if (!this.user) {
        this.router.navigate(['/login']);
      } else {
        // Cargar perfil completo del usuario para obtener profilePictureUrl
        const token = localStorage.getItem('token') ?? undefined;
        if (token) {
          this.userService.getUserProfile(token).subscribe({
            next: (profile: UserProfile) => {
              if (this.user) {
                this.user = { ...this.user, profilePictureUrl: profile.profilePictureUrl }; // Changed to profilePictureUrl
              }
            },
            error: (error) => {
              console.error('Error al cargar el perfil del usuario:', error);
            }
          });
        }
      }
    });

    // Cargar productos iniciales
    this.loadProducts();

    // Cargar productos vistos recientemente
    this.loadRecentlyViewed();

    // Cargar productos similares (simulación o backend)
    this.loadSimilarProducts();

    // Cargar conversaciones del usuario para asociarlas a los productos
    this.loadUserConversations();
  }

  // Cargar todos los productos
  loadProducts(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token') ?? undefined;
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        // Actualizar conversaciones para los productos
        this.updateProductConversations();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.isLoading = false;
      }
    });
  }

  // Buscar productos por palabra clave
  buscarProductos(): void {
    if (!this.searchKeyword.trim()) {
      this.search = false;
      this.loadProducts();
      return;
    }
    this.isLoading = true;
    this.search = true;
    this.searchCategory = false;
    this.productService
      .searchProducts(this.searchKeyword, this.latitude, this.longitude, this.radius, this.selectedCategory)
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
          this.updateProductConversations();
        },
        error: (error) => {
          console.error('Error al buscar productos:', error);
          this.isLoading = false;
        }
      });
  }

  // Filtrar productos por categoría
  filtrarPorCategoria(category: string): void {
    this.searchCategory = true;
    this.search = false;
    this.isLoading = true;
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
      },
      error: (error) => {
        console.error('Error al filtrar por categoría:', error);
        this.isLoading = false;
      }
    });
  }

  // Cargar conversaciones del usuario y asociarlas a los productos
  loadUserConversations(): void {
    if (!this.user) return;
    this.negotiationService.getUserConversations().subscribe({
      next: (conversations) => {
        this.updateProductConversations(conversations);
      },
      error: (error) => {
        console.error('Error al cargar conversaciones:', error);
      }
    });
  }

  // Actualizar las conversaciones asociadas a los productos
  updateProductConversations(conversations?: Conversation[]): void {
    if (!conversations) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conv) => {
          this.applyConversationsToProducts(conv);
        },
        error: (error) => {
          console.error('Error al actualizar conversaciones:', error);
        }
      });
    } else {
      this.applyConversationsToProducts(conversations);
    }
  }

  // Asignar conversaciones a los productos
  applyConversationsToProducts(conversations: Conversation[]): void {
    this.products = this.products.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id.toString());
      return conversation ? { ...product, conversation } : product;
    });
    this.recentlyViewed = this.recentlyViewed.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id.toString());
      return conversation ? { ...product, conversation } : product;
    });
    this.similarProducts = this.similarProducts.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id.toString());
      return conversation ? { ...product, conversation } : product;
    });
  }

  // Navegar a la página de creación de producto
  irACrear(): void {
    this.router.navigate(['/create-product']);
  }

  // Navegar a la página de login
  irALogin(): void {
    this.router.navigate(['/login']);
  }

  // Navegar al perfil del usuario
  irAProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  // Navegar a los chats del usuario
  irAMisChats(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/chats']);
  }

  // Navegar a los favoritos del usuario (aún sin implementar)
  irAFavoritos(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/favorites']);
  }

  // Navegar a la página de contacto
  irAContacta(): void {
    this.router.navigate(['/contact']);
  }

  // Cerrar sesión
  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  // Alternar el menú de perfil
  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  // Navegar al detalle de un producto
  goToProductDetail(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.addToRecentlyViewed(product);
    }
    this.router.navigate([`/product/${productId}`]);
  }

  // Iniciar una negociación
  startNegotiation(productId: number): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    console.log('Iniciando negociación para el producto:', productId);
    this.negotiationService.startNegotiation(productId.toString()).subscribe({
      next: (conversation) => {
        console.log('Conversación creada:', conversation);
        if (!conversation || !conversation.id) {
          console.error('No se recibió un ID de conversación válido:', conversation);
          alert('No se pudo iniciar la conversación. Inténtalo de nuevo.');
          return;
        }
        // Actualizar el producto con la nueva conversación
        this.products = this.products.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.recentlyViewed = this.recentlyViewed.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.similarProducts = this.similarProducts.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        // Navegar al chat usando el objeto state
        this.router.navigate(['/chat'], { state: { conversationId: conversation.id } }).then(success => {
          if (!success) {
            console.error('La navegación al chat falló');
            alert('No se pudo navegar al chat. Verifica la configuración de las rutas.');
          } else {
            console.log('Navegación exitosa a /chat con conversationId:', conversation.id);
          }
        });
      },
      error: (error) => {
        console.error('Error al iniciar negociación:', error);
        alert('Error al iniciar la conversación. Por favor, intenta de nuevo.');
      }
    });
  }

  // Ir a un chat existente
  goToChat(conversationId: number): void {
    console.log('Intentando navegar a /chat con conversationId:', conversationId);
    this.router.navigate(['/chat'], { state: { conversationId } }).then(success => {
      if (!success) {
        console.error('La navegación al chat falló para conversationId:', conversationId);
        alert('No se pudo navegar al chat. Verifica la configuración de las rutas.');
      } else {
        console.log('Navegación exitosa a /chat con conversationId:', conversationId);
      }
    });
  }

  // Abrir el modal de ubicación
  openLocationModal(): void {
    this.isLocationModalOpen = true;
  }

  // Cerrar el modal de ubicación
  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  // Centrar el mapa en la ubicación
  centerMapOnLocation(): void {
    const locationInput = (document.getElementById('locationInput') as HTMLInputElement).value;
    // Aquí deberías integrar una API de geocodificación (como Google Maps Geocoding API)
    // Por ahora, simularemos las coordenadas (Madrid como ejemplo)
    if (locationInput.toLowerCase().includes('madrid')) {
      this.latitude = 40.416775;
      this.longitude = -3.703790;
    } else {
      this.latitude = undefined;
      this.longitude = undefined;
    }
    console.log('Centrando mapa en:', locationInput, { lat: this.latitude, lng: this.longitude });
  }

  // Actualizar el radio del mapa
  updateRadius(): void {
    console.log('Radio actualizado a:', this.radius);
  }

  // Aplicar filtro de ubicación y buscar
  applyFilterAndSearch(): void {
    this.isLoading = true;
    this.isLocationModalOpen = false;
    this.search = true;
    this.searchCategory = false;
    this.productService
      .searchProductsByCoordinates(this.latitude, this.longitude, this.radius, this.selectedCategory, this.searchKeyword)
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
          this.updateProductConversations();
        },
        error: (error) => {
          console.error('Error al buscar por coordenadas:', error);
          this.isLoading = false;
        }
      });
  }

  // Añadir un producto a "Vistos Recientemente"
  addToRecentlyViewed(product: Product): void {
    const index = this.recentlyViewed.findIndex(p => p.id === product.id);
    if (index === -1) {
      this.recentlyViewed.unshift(product);
      if (this.recentlyViewed.length > 5) {
        this.recentlyViewed.pop();
      }
      localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
    }
  }

  // Cargar "Vistos Recientemente" desde localStorage
  loadRecentlyViewed(): void {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      this.recentlyViewed = JSON.parse(saved);
      // Asegurarnos de que los productos tengan las conversaciones actualizadas
      this.updateProductConversations();
    }
  }

  // Cargar "Más como estos" (simulación)
  loadSimilarProducts(): void {
    // Simulación: Tomar algunos productos aleatorios de la lista
    this.similarProducts = this.products.slice(0, 4);
    // Para una integración real, podrías usar un endpoint del backend:
    // this.productService.getSimilarProducts().subscribe(products => this.similarProducts = products);
  }
}