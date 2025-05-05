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
   private marker: google.maps.marker.AdvancedMarkerElement | undefined; // Cambiado a AdvancedMarkerElement
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
    console.log('Iniciando búsqueda de productos...');
    
    // Verificar si hay al menos un criterio de búsqueda
    if (!this.searchKeyword && !this.selectedCategory && !this.marker?.position) {
      console.warn('Debe especificar al menos una palabra clave, categoría o ubicación para buscar.');
      return;
    }
  
    // Obtener latitud y longitud solo si el marcador tiene posición
    const latitude = this.marker?.position instanceof google.maps.LatLng
      ? this.marker.position.lat()
      : undefined;
  
    const longitude = this.marker?.position instanceof google.maps.LatLng
      ? this.marker.position.lng()
      : undefined;
  
    console.log('Latitud:', latitude);
    console.log('Longitud:', longitude);
  
    // Construir los parámetros de búsqueda
    const searchParams = {
      keyword: this.searchKeyword || undefined, // Si no hay keyword, enviar undefined
      latitude: latitude, // Puede ser undefined si no hay posición
      longitude: longitude, // Puede ser undefined si no hay posición
      radius: latitude && longitude ? this.radius : undefined, // Solo enviar el radio si hay ubicación
      category: this.selectedCategory || undefined, // Si no hay categoría, enviar undefined
    };
  
    console.log('Parámetros de búsqueda construidos:', searchParams);
  
    // Llamar al servicio con los parámetros
    this.productService.searchProducts(
      searchParams.keyword || '', // Si es undefined, pasar una cadena vacía
      searchParams.latitude,
      searchParams.longitude,
      searchParams.radius,
      searchParams.category
    ).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.products = response;
        this.search = true;
        this.searchCategory = false;
        console.log('Productos encontrados:', this.products);
      },
      error: (error) => {
        console.error('Error al buscar productos:', error);
      }
    });
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
  
    setTimeout(() => {
      if (!this.map) {
        this.initializeMap();
        this.initializeAutocomplete();
      } else {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 0);
  }
  
  // Cerrar el modal de ubicación
  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }
  
  // Aplicar el filtro de ubicación
  applyFilter(): void {
    const position = this.marker?.position; // Acceder directamente a la propiedad 'position'
    if (position instanceof google.maps.LatLng) {
      console.log('Filtro aplicado:', {
        lat: position.lat(),
        lng: position.lng(),
        radius: this.radius,
      });
      // Aquí puedes enviar los datos al backend o filtrar los productos localmente
    } else {
      console.warn('No se ha seleccionado una ubicación. El filtro de radio no se aplicará.');
    }
    this.closeLocationModal();
  }
  
  private initializeMap(): void {
    const defaultLocation = new google.maps.LatLng(40.416775, -3.703790); // Madrid, España
  
    // Inicializar el mapa
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: defaultLocation,
      zoom: 12,
    });
  
    // Usar AdvancedMarkerElement para el marcador
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: defaultLocation,
      title: 'Ubicación actual',
    });
  
    // Crear un círculo alrededor del marcador
    this.circle = new google.maps.Circle({
      map: this.map,
      radius: this.radius * 1000, // Convertir kilómetros a metros
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 1,
    });
  
    // Actualizar manualmente la posición del círculo
    if (this.marker.position) {
      this.circle.setCenter(this.marker.position);
    }
  }
  private initializeAutocomplete(): void {
    const input = document.getElementById('locationInput') as HTMLInputElement;
  
    // Crear un PlaceAutocompleteElement en lugar de Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(input);
  
    // Escuchar el evento de cambio de lugar
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        // Asegurarse de que lat y lng sean valores numéricos
        const lat = typeof place.geometry.location.lat === 'function'
          ? (place.geometry.location.lat as () => number)()
          : place.geometry.location.lat;
  
        const lng = typeof place.geometry.location.lng === 'function'
          ? (place.geometry.location.lng as () => number)()
          : place.geometry.location.lng;
  
        if (typeof lat === 'number' && typeof lng === 'number') {
          // Actualizar el mapa y el marcador
          this.map?.setCenter({ lat, lng });
          if (this.marker) {
            this.marker.position = new google.maps.LatLng(lat, lng); // Usar LatLng explícitamente
          }
  
          // Actualizar el círculo si existe
          if (this.circle) {
            this.circle.setCenter(new google.maps.LatLng(lat, lng));
          }
        } else {
          console.error('No se pudo obtener latitud o longitud del lugar seleccionado.');
        }
      }
    });
  }
}