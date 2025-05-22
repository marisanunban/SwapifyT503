import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Product, Conversation } from '../../../models/product.model';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';
import { UserProfile, UserDto } from '../../../models/user.model';

declare const google: any;

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
  user: UserDto | null = null;
  isProfileMenuOpen: boolean = false;
  isLocationModalOpen: boolean = false;
  radius: number = 10;
  latitude: number = 40.416775; // Madrid por defecto
  longitude: number = -3.703790; // Madrid por defecto
  recentlyViewed: Product[] = [];
  similarProducts: Product[] = [];
  map: any;
  marker: any; // Para el marcador en el mapa

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user as UserDto | null;
      if (!this.user) {
        this.router.navigate(['/login']);
      } else {
        const token = localStorage.getItem('token') ?? undefined;
        if (token) {
          this.userService.getUserProfile(token).subscribe({
            next: (profile: UserProfile) => {
              if (this.user) {
                this.user = { ...this.user, profilePictureUrl: profile.profilePictureUrl };
              }
            },
            error: (error) => {
              console.error('Error al cargar el perfil del usuario:', error);
            }
          });
        }
      }
    });

    this.loadProducts();
    this.loadRecentlyViewed();
    this.loadSimilarProducts();
    this.loadUserConversations();
  }

  initMap(): void {
    const defaultLocation = { lat: this.latitude, lng: this.longitude }; // Usar valores iniciales
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: defaultLocation,
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.map.setCenter({ lat: this.latitude, lng: this.longitude });
          this.addMarker(this.latitude, this.longitude);
          console.log('Mapa inicializado en la ubicación del usuario:', { lat: this.latitude, lng: this.longitude });
        },
        (error) => {
          console.error('Error al obtener la ubicación del usuario:', error);
          alert('No se pudo obtener tu ubicación. Usando Madrid como ubicación predeterminada.');
          this.addMarker(this.latitude, this.longitude);
          console.log('Mapa inicializado en ubicación predeterminada (Madrid):', defaultLocation);
        }
      );
    } else {
      alert('La geolocalización no está soportada por tu navegador. Usando Madrid como ubicación predeterminada.');
      this.addMarker(this.latitude, this.longitude);
      console.log('Geolocalización no soportada, mapa inicializado en:', defaultLocation);
    }

    // Agregar listener para clics en el mapa
    this.map.addListener('click', (event: any) => {
      this.latitude = event.latLng.lat();
      this.longitude = event.latLng.lng();
      this.addMarker(this.latitude, this.longitude);
      console.log('Ubicación seleccionada en el mapa:', { lat: this.latitude, lng: this.longitude });

      // Geocodificación inversa para actualizar el campo de texto
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: this.latitude, lng: this.longitude } }, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const locationInput = document.getElementById('locationInput') as HTMLInputElement;
          locationInput.value = results[0].formatted_address;
          console.log('Dirección obtenida por geocodificación inversa:', results[0].formatted_address);
        } else {
          console.error('Error en geocodificación inversa:', status);
        }
      });
    });
  }

  addMarker(lat: number, lng: number): void {
    // Eliminar marcador anterior si existe
    if (this.marker) {
      this.marker.setMap(null);
    }
    // Crear nuevo marcador
    this.marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: 'Ubicación seleccionada'
    });
  }

  openLocationModal(): void {
    this.isLocationModalOpen = true;
    setTimeout(() => {
      if (!this.map) {
        this.initMap();
      }
    }, 0);
  }

  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  centerMapOnLocation(): void {
    const locationInput = (document.getElementById('locationInput') as HTMLInputElement).value;
    if (!locationInput) {
      alert('Por favor, introduce una ubicación');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: locationInput }, (results: any, status: any) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        this.latitude = results[0].geometry.location.lat();
        this.longitude = results[0].geometry.location.lng();
        this.map.setCenter({ lat: this.latitude, lng: this.longitude });
        this.addMarker(this.latitude, this.longitude);
        console.log('Mapa centrado en:', locationInput, { lat: this.latitude, lng: this.longitude });
      } else {
        alert('No se pudo encontrar la ubicación. Inténtalo de nuevo.');
        console.error('Error en geocodificación:', status);
      }
    });
  }

  updateRadius(): void {
    console.log('Radio actualizado a:', this.radius);
  }

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
          alert('Error al buscar productos por ubicación. Por favor, intenta de nuevo.');
        }
      });
  }

  loadProducts(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token') ?? undefined;
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.isLoading = false;
      }
    });
  }

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

  irACrear(): void {
    this.router.navigate(['/create-product']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  irAProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  irAMisChats(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/chats']);
  }

  irAFavoritos(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/favorites']);
  }

  irAContacta(): void {
    this.router.navigate(['/contact']);
  }

  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  goToProductDetail(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.addToRecentlyViewed(product);
    }
    this.router.navigate([`/product/${productId}`]);
  }

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
        this.products = this.products.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.recentlyViewed = this.recentlyViewed.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.similarProducts = this.similarProducts.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
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

  loadRecentlyViewed(): void {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      this.recentlyViewed = JSON.parse(saved);
      this.updateProductConversations();
    }
  }

  loadSimilarProducts(): void {
    this.similarProducts = this.products.slice(0, 4);
  }
} 