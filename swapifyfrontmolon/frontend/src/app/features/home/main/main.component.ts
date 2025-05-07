// main.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class MainComponent implements OnInit, AfterViewInit {
  user: { id: number; username: string; credits: number; locationName: string; profilePicture: string; } | null = null;
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

  // Variables para el modal de ubicación
  isLocationModalOpen: boolean = false;
  radius: number = 10;

  // Variables para el mapa
  private map: google.maps.Map | undefined;
  private marker: google.maps.marker.AdvancedMarkerElement | undefined;
  private markerPosition: google.maps.LatLngLiteral | undefined; // Para guardar posición
  private circle: google.maps.Circle | undefined;
  private geocoder: google.maps.Geocoder | undefined;
  private autocomplete: google.maps.places.Autocomplete | undefined;
  selectedLatLng: google.maps.LatLng | null = null;
//variables para almacenar
 // Variables temporales para almacenar la ubicación y la categoría seleccionadas
 private tempSelectedCategory: string = '';
 private tempSelectedLatLng: google.maps.LatLng | null = null;
  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService,
    private negotiationService: NegotiationService,
    private userService: UserService
  ) { }

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

  // Método para guardar temporalmente la categoría seleccionada
  seleccionarCategoria(categoria: string): void {
    this.tempSelectedCategory = categoria;
    console.log('Categoría seleccionada:', categoria);
  }

  // Método para guardar temporalmente la ubicación seleccionada desde el modal
  seleccionarUbicacion(latLng: google.maps.LatLng): void {
    this.tempSelectedLatLng = latLng;
    console.log('Ubicación seleccionada:', latLng);
  }

 // Método para realizar la búsqueda de productos
 buscarProductos() {
  console.log('Iniciando búsqueda de productos...');

  // Verificar si al menos uno de los criterios de búsqueda está presente
  if (!this.searchKeyword && !this.tempSelectedCategory && !this.tempSelectedLatLng) {
    console.warn('Debe especificar al menos una palabra clave, categoría o ubicación para buscar.');
    return;
  }

  // Construir los parámetros de búsqueda
  const searchParams: any = {
    keyword: this.searchKeyword || undefined,  // Si no hay keyword, enviar undefined
    latitude: this.tempSelectedLatLng ? this.tempSelectedLatLng.lat() : undefined,
    longitude: this.tempSelectedLatLng ? this.tempSelectedLatLng.lng() : undefined,
    radius: this.tempSelectedLatLng ? this.radius : undefined, // Solo si hay ubicación
    category: this.selectedCategory || undefined,  // Si no hay categoría, enviar undefined
  };

  console.log('Parámetros de búsqueda construidos:', searchParams);

  // Llamar al servicio para realizar la búsqueda
  this.productService.searchProducts(
    searchParams.keyword || '',  // Si no hay palabra clave, pasar una cadena vacía
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
    this.router.navigate(['home']);
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

  centerMapOnLocation(): void {
    const input = (document.getElementById('locationInput') as HTMLInputElement)?.value;
    if (!input || !this.geocoder) return;

    this.geocoder.geocode({ address: input }, (results, status) => {
      if (status === 'OK' && results && results[0].geometry.location) {
        const latLng = results[0].geometry.location.toJSON();
        this.setMapMarker(latLng);
      } else {
        console.error('No se pudo geocodificar la dirección:', status);
      }
    });
  }

  setMapMarker(position: google.maps.LatLngLiteral): void {
    this.markerPosition = position;

    // Crear o mover el marcador
    if (this.marker) {
      this.marker.position = position;
    } else {
      this.marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: this.map!,
      });
    }

    // Crear o actualizar el círculo de radio
    if (this.circle) {
      this.circle.setMap(null);
    }
    this.circle = new google.maps.Circle({
      map: this.map!,
      center: position,
      radius: this.radius * 1000, // km a metros
      fillColor: '#4285F4',
      fillOpacity: 0.25,
      strokeColor: '#4285F4',
      strokeOpacity: 0.5,
      strokeWeight: 1,
    });

    this.map!.setCenter(position);
    this.map!.setZoom(13);
  }

  updateRadius(): void {
    if (this.circle && this.markerPosition) {
      this.circle.setRadius(this.radius * 1000);
    }
  }

  ngAfterViewInit(): void {
    if (typeof google === 'undefined') {
      console.error('Google Maps no está cargado');
      return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const defaultPosition = { lat: 40.4168, lng: -3.7038 }; // Madrid

    this.map = new google.maps.Map(mapElement, {
      center: defaultPosition,
      zoom: 12,
    });

    this.geocoder = new google.maps.Geocoder();

    // Autocompletado
    const input = document.getElementById('locationInput') as HTMLInputElement;
    if (input) {
      this.autocomplete = new google.maps.places.Autocomplete(input);
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete!.getPlace();
        if (place.geometry && place.geometry.location) {
          const latLng = place.geometry.location.toJSON();
          this.setMapMarker(latLng);
        }
      });
    }
  }

  applyFilter(): void {
    if (!this.selectedLatLng) {
      console.warn('No se ha seleccionado ninguna ubicación.');
      this.closeLocationModal();
      return;
    }

    // Actualizamos el marcador y círculo en el mapa antes de buscar
    this.updateRadius();


    this.closeLocationModal();
  }

  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  openLocationModal(): void {
    this.isLocationModalOpen = true;

    // Inicializamos el mapa con un pequeño retraso para asegurar que el DOM esté listo
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  initMap(): void {
    // Creamos el objeto del mapa con las configuraciones iniciales
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 40.4168, lng: -3.7038 }, // Por defecto, se centra en Madrid (puedes cambiarlo)
      zoom: 12,
    });

    // Configuramos el autocompletado de ubicaciones
    this.autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('locationInput') as HTMLInputElement
    );

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      if (place.geometry) {
        this.selectedLatLng = place.geometry.location as google.maps.LatLng;
        this.addMarker(this.selectedLatLng);
      }
    });

    // Si ya tenemos la ubicación del usuario, centramos el mapa allí
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        this.map?.setCenter(userLocation);
        this.addMarker(userLocation);
      });
    }

    // Creamos el círculo para seleccionar el radio de búsqueda
    this.circle = new google.maps.Circle({
      map: this.map,
      radius: this.radius * 1000, // El radio en metros (convertimos de km a metros)
      fillColor: '#FF6600',
      fillOpacity: 0.2,
      strokeColor: '#FF6600',
      strokeOpacity: 0.5,
    });

    if (this.selectedLatLng) {
      this.circle.setCenter(this.selectedLatLng);
    }
  }

  /// Método para agregar el marcador y verificar la latitud y longitud
addMarker(latLng: google.maps.LatLng): void {
  // Verificamos que latLng no sea undefined antes de continuar
  if (!latLng) {
    console.error('La latitud y longitud no están definidas correctamente.');
    return;
  }

  // Si ya existe un marcador, actualizamos la posición
  if (this.marker) {
    this.marker.position = latLng;
  } else {
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      position: latLng,
      map: this.map,
    });
  }

  // Guardamos la ubicación seleccionada temporalmente
  this.tempSelectedLatLng = latLng;
  
  // Verificar que la latitud y longitud están definidas
  console.log('Latitud:', latLng.lat(), 'Longitud:', latLng.lng());

  // Actualizamos el círculo (si existe)
  if (this.circle) {
    this.circle.setCenter(latLng);
  }
}
}
