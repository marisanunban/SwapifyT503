// main.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  user: { id: number; username: string; credits: number; locationName: string; profilePicture:string;} | null = null;
  products: any[] = [];
  search: boolean = false;
  searchKeyword: string = '';
  conversations: any[] = [];
  otherUserNames: { [conversationId: number]: string } = {};
  isSearchActive: boolean = false;
  isCategoryActive: boolean = false;
  selectedCategory: string = '';
  searchCategory = false;
  searchInLocality = '';
  isProfileMenuOpen = false; // Nueva propiedad para controlar el menú desplegable
  radius:number = 10;
   // Variables para el modal de ubicación
   isLocationModalOpen: boolean = false;

   // Variables para el mapa
   private map: google.maps.Map | undefined;
   private marker: google.maps.Marker | undefined;
   private circle: google.maps.Circle | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private negotiationService: NegotiationService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: (profile) => {
          this.user = profile;
          console.log('Perfil del usuario cargado:', this.user);
        },
        error: (error) => {
          console.error('Error al cargar el perfil del usuario:', error);
        }
      });
    }
    this.recogerProductos();
  }

  // Método para alternar el menú desplegable
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  // Método para cerrar el menú desplegable
  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  filtrarPorCategoria(categoria: string): void {
    this.productService.getProductsByCategory(categoria).subscribe({
      next: (response) => {
        this.products = response;
        this.searchCategory = true;
        this.search = false; 
        console.log('Productos filtrados:', this.products);
      },
      error: (error) => {
        console.error('Error al filtrar productos:', error);
      }
    });
  }

  loadConversations() {
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
        this.updateProductsWithConversations();
        console.log('Conversaciones cargadas:', this.conversations);
      },
      error: (error) => {
        console.error('Error al cargar conversaciones:', error);
      }
    });
  }

  updateProductsWithConversations() {
    this.products = this.products.map(product => {
      const conversation = this.conversations.find(conv =>
        (conv.buyerId === this.user?.id && conv.sellerId === product.ownerId) ||
        (conv.sellerId === this.user?.id && conv.buyerId === product.ownerId)
      );
      return { ...product, conversation };
    });
  }

  recogerProductos() {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        this.products = response;
        if (this.user) {
          this.updateProductsWithConversations();
        }
        console.log('Productos:', this.products);
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      }
    });
  }

  buscarProductos() {
    if (!this.searchKeyword) {
      console.warn('Debe especificar una palabra clave para buscar.');
      return;
    }
  
    this.productService.searchProducts(this.searchKeyword).subscribe(
      (response) => {
        let filteredProducts = response;
        console.log('Productos encontrados por palabra clave:', filteredProducts);
  
        if (this.selectedCategory) {
          filteredProducts = filteredProducts.filter(product => product.category === this.selectedCategory);
          console.log('Productos filtrados por categoría:', filteredProducts);
        }
  
        if (this.searchInLocality) {
          const userLocation = this.user?.locationName;
          if (!userLocation) {
            console.warn('No se ha especificado la ubicación del usuario.');
            return;
          }
  
          this.productService.getProductsByLocation(userLocation).subscribe(
            (locationFilteredProducts) => {
              const locationFilteredIds = new Set(locationFilteredProducts.map(p => p.id));
              filteredProducts = filteredProducts.filter(product => locationFilteredIds.has(product.id));
              console.log('Productos filtrados por localización:', filteredProducts);
  
              this.products = filteredProducts;
              this.search = true;
              this.searchCategory = false;
            },
            (error) => {
              console.error('Error al filtrar productos por localización:', error);
            }
          );
        } else {
          this.products = filteredProducts;
          this.search = true;
          this.searchCategory = false;
        }
      },
      (error) => {
        console.error('Error al buscar productos:', error);
      }
    );
  }

  startChat(productId: string) {
    const token = localStorage.getItem('token');
    if (!this.user || !token) {
      console.warn('Usuario no autenticado. Redirigiendo a login.');
      this.router.navigate(['/login']);
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) {
      console.error('Producto no encontrado.');
      return;
    }

    const existingConversation = this.conversations.find(conv =>
      (conv.buyerId === this.user!.id && conv.sellerId === product.ownerId) ||
      (conv.sellerId === this.user!.id && conv.buyerId === product.ownerId)
    );

    if (existingConversation) {
      this.goToChat(existingConversation.id);
    } else {
      this.negotiationService.startNegotiation(productId).subscribe({
        next: (conversation) => {
          console.log('Conversación iniciada:', conversation);
          this.conversations.push(conversation);
          this.products = this.products.map(p => {
            if (p.id === productId) {
              return { ...p, conversation };
            }
            return p;
          });
          const otherUserId = conversation.buyerId === this.user!.id ? conversation.sellerId : conversation.buyerId;
          this.userService.getUserById(otherUserId, token).subscribe({
            next: (userInfo) => {
              this.otherUserNames[conversation.id] = userInfo.username || `Usuario ${otherUserId}`;
            },
            error: () => {
              this.otherUserNames[conversation.id] = `Usuario ${otherUserId}`;
            }
          });
          this.goToChat(conversation.id);
        },
        error: (error) => {
          console.error('Error al iniciar la conversación:', error);
        }
      });
    }
  }

  goToChat(conversationId: number) {
    this.router.navigate(['/chat'], { state: { conversationId } });
  }

  logout() {
    this.authService.logout();
    this.closeProfileMenu(); // Cerrar el menú al hacer logout
    this.router.navigate(['/main']);
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  irAProfile() {
    this.router.navigate(['/profile']);
    this.closeProfileMenu(); // Cerrar el menú al navegar
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irAContacta() {
    this.router.navigate(['/contact']);
  }

  irACrear() {
    this.router.navigate(['/create']);
  }

  irAMisChats() {
    this.router.navigate(['/chats']);
    this.closeProfileMenu(); // Cerrar el menú al navegar
  }

  irAFavoritos() {
    this.router.navigate(['/favorites']);
    this.closeProfileMenu(); // Cerrar el menú al navegar
  }







  ngAfterViewInit(): void {

  }

  // Abrir el modal de ubicación
  openLocationModal(): void {
    this.isLocationModalOpen = true;
  
    // Esperar a que el modal se renderice antes de inicializar o actualizar el mapa
    setTimeout(() => {
      if (!this.map) {
        // Inicializar el mapa si no está inicializado
        this.initializeMap();
        this.initializeAutocomplete();
      } else {
        // Forzar la actualización del mapa si ya está inicializado
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(this.marker?.getPosition() || { lat: 40.416775, lng: -3.703790 }); // Madrid, España
      }
    }, 0);
  }

  // Cerrar el modal de ubicación
  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  // Aplicar el filtro de ubicación
  applyFilter(): void {
    const position = this.marker?.getPosition();
    if (position) {
      console.log('Filtro aplicado:', {
        lat: position.lat(),
        lng: position.lng(),
        radius: this.radius
      });
      this.closeLocationModal();
      // Aquí puedes enviar los datos al backend o filtrar los productos localmente
    }
  }

  // Inicializar el mapa
  private initializeMap(): void {
    const defaultLocation = { lat: 40.416775, lng: -3.703790 }; // Madrid, España
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: defaultLocation,
      zoom: 12
    });
  
    this.marker = new google.maps.Marker({
      position: defaultLocation,
      map: this.map,
      draggable: true
    });
  
    this.circle = new google.maps.Circle({
      map: this.map,
      radius: this.radius * 1000, // Convertir kilómetros a metros
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 1
    });
  
    this.circle.bindTo('center', this.marker, 'position');
  }
  // Inicializar el autocompletado de direcciones
  private initializeAutocomplete(): void {
    const input = document.getElementById('locationInput') as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Actualizar el mapa y el marcador
        this.map?.setCenter({ lat, lng });
        this.marker?.setPosition({ lat, lng });
      }
    });
  }

  // Geocodificación inversa para obtener la dirección a partir de coordenadas
  private reverseGeocode(lat: number, lng: number): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        console.log('Dirección seleccionada:', results[0].formatted_address);
      }
    });
  }
}