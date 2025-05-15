import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { FormsModule } from '@angular/forms';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';


export interface Product {
  id: number;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ownerId: number;
  category?: string;
  imageId?: string;
  conversation?: { id: number };
}

export interface User {
  id: number;
  username: string;
  credits: number;
  profilePicture?: string;
}
export interface UserProfile {
  profilePicture: string;
}

declare var google: any;


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule], 
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  user: User | null = null;
    userProfile: UserProfile | null = null;
    products: Product[] = [];
    searchKeyword: string = '';
    selectedCategory: string = '';
    isLocationModalOpen: boolean = false;
    tempSelectedLatLng: { lat: number; lng: number } | null = null;
    radius: number = 10;
    search: boolean = false;
    searchCategory: boolean = false;
    isProfileMenuOpen: boolean = false;
    map: any;
    isLoading: boolean = false;

  constructor(
    private router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService,
  ){}
  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
      // Obtener el token desde localStorage
  const token = localStorage.getItem('token');
  if (token) {
    this.userService.getUserProfile(token).subscribe({
      next: (userProfile) => {
        this.userProfile = userProfile;
      },
      error: (err) => {
        console.error('Error al obtener el perfil del usuario:', err);
      }
    });
  } else {
    console.error('No se encontró un token en localStorage.');
  }
  }


  fetchConversations() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conversations) => {
          this.products = this.products.map(product => ({
            ...product,
            conversation: conversations.find(conv => conv.productId === product.id.toString() && conv.status === 'ACTIVE')
          }));
        },
        error: (error) => {
          console.error('Error al obtener conversaciones:', error);
        }
      });
    }
  }

   initializeMap() {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('No se encontró el elemento del mapa (#map)');
        return;
      }
      if (!google || !google.maps) {
        console.error('La API de Google Maps no está cargada');
        return;
      }
  
      let initialLatLng = { lat: 40.4168, lng: -3.7038 }; // Madrid por defecto
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            initialLatLng = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.renderMap(mapElement, initialLatLng);
          },
          error => {
            console.error('Error al obtener la ubicación:', error);
            this.renderMap(mapElement, initialLatLng);
          }
        );
      } else {
        this.renderMap(mapElement, initialLatLng);
      }
    }
  
    renderMap(mapElement: HTMLElement, center: { lat: number; lng: number }) {
      this.map = new google.maps.Map(mapElement, {
        center: new google.maps.LatLng(center.lat, center.lng), // Convertir a LatLng
        zoom: 12,
      });
      this.addAutocomplete();
      this.addMarker(center); // Añadir marcador inicial
      this.addClickListener(); // Añadir listener para clics
      this.drawCircle(); // Dibujar círculo si hay tempSelectedLatLng
    }
  
    addAutocomplete() {
      const input = document.getElementById('locationInput') as HTMLInputElement;
      if (!input) {
        console.error('No se encontró el input de ubicación (#locationInput)');
        return;
      }
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const latLng = place.geometry.location;
          this.map.setCenter(latLng);
          this.addMarker(latLng);
        }
      });
    }
  
    addMarker(latLng: any) {
      if (!this.map || !latLng) {
        console.error('Mapa o latLng no definidos:', { map: this.map, latLng });
        return;
      }
  
      // Depuración: Mostrar el valor de latLng
      console.log('latLng recibido en addMarker:', latLng);
  
      // Determinar las coordenadas de latLng
      let lat: number;
      let lng: number;
  
      if (latLng instanceof google.maps.LatLng) {
        lat = latLng.lat();
        lng = latLng.lng();
      } else if (typeof latLng.lat === 'number' && typeof latLng.lng === 'number') {
        lat = latLng.lat;
        lng = latLng.lng;
      } else if (typeof latLng.lat === 'function' && typeof latLng.lng === 'function') {
        lat = latLng.lat();
        lng = latLng.lng();
      } else {
        console.error('Formato de latLng no soportado:', latLng);
        return;
      }
  
      // Añadir el marcador al mapa
      new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        map: this.map,
      });
  
      // Actualizar tempSelectedLatLng con el formato correcto
      this.tempSelectedLatLng = { lat, lng };
      this.drawCircle(); // Redibujar círculo tras mover el marcador
    }
  
    drawCircle() {
      if (this.map && this.tempSelectedLatLng) {
        // Remover círculo existente si lo hay
        if (this.map.circle) {
          this.map.circle.setMap(null);
        }
        // Dibujar nuevo círculo
        this.map.circle = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: this.map,
          center: new google.maps.LatLng(this.tempSelectedLatLng.lat, this.tempSelectedLatLng.lng),
          radius: this.radius * 1000, // Convertir km a metros
        });
        this.map.fitBounds(this.map.circle.getBounds()); // Ajustar zoom al círculo
      }
    }
  
    addClickListener() {
      if (this.map) {
        this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const latLng = event.latLng;
          this.addMarker(latLng); // Añadir marcador y actualizar tempSelectedLatLng
          this.buscarProductos(); // Buscar productos con la nueva ubicación
        });
      }
    }
  
    centerMapOnLocation() {
      if (this.tempSelectedLatLng) {
        this.map.setCenter(new google.maps.LatLng(this.tempSelectedLatLng.lat, this.tempSelectedLatLng.lng));
        this.drawCircle();
      }
    }
  
    updateRadius() {
      // Método para actualizar el radio si se cambia dinámicamente
      this.drawCircle();
    }
  
    openLocationModal() {
      this.isLocationModalOpen = true;
      setTimeout(() => {
        if (!google || !google.maps) {
          console.error('La API de Google Maps no está disponible. Asegúrate de que el script esté cargado.');
          alert('No se pudo cargar el mapa. Por favor, intenta de nuevo más tarde.');
          return;
        }
        this.initializeMap();
      }, 0);
    }
  
    closeLocationModal() {
      this.isLocationModalOpen = false;
    }
  
    applyFilterAndSearch() {
      if (this.tempSelectedLatLng) {
        this.buscarProductos();
      }
      this.closeLocationModal();
    }
  
    buscarProductos() {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token disponible.');
        alert('Por favor, inicia sesión para buscar productos.');
        return;
      }
  
      this.isLoading = true;
      if (this.tempSelectedLatLng) {
        this.productService.searchProductsByCoordinates(
          this.tempSelectedLatLng.lat,
          this.tempSelectedLatLng.lng,
          this.radius,
          this.selectedCategory,
          this.searchKeyword
        ).subscribe({
          next: (response: Product[]) => {
            console.log('Respuesta del backend:', response);
            this.products = response;
            this.search = !!this.searchKeyword || !!this.tempSelectedLatLng;
            this.searchCategory = !!this.selectedCategory && !this.searchKeyword && !this.tempSelectedLatLng;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al buscar productos:', error);
            this.products = [];
            this.isLoading = false;
            alert('Hubo un error al buscar productos. Por favor, intenta de nuevo más tarde.');
          }
        });
      } else {
        // Usar getAllProducts con filtros solo si hay categoría o keyword no vacía
        const effectiveKeyword = this.searchKeyword.trim() || undefined;
        if (this.selectedCategory || effectiveKeyword) {
          this.productService.getAllProducts(token).subscribe({
            next: (response: Product[]) => {
              this.products = response.filter(product => {
                const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
                const matchesKeyword = !effectiveKeyword || (product.title?.toLowerCase().includes(effectiveKeyword.toLowerCase()) || false);
                return matchesCategory && matchesKeyword;
              });
              this.search = !!effectiveKeyword;
              this.searchCategory = !!this.selectedCategory && !effectiveKeyword;
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error al recuperar productos:', error);
              this.products = [];
              this.isLoading = false;
              alert('No se pudieron cargar los productos. Inténtalo de nuevo.');
            }
          });
        } else {
          // Si no hay filtros, cargar todos los productos
          this.productService.getAllProducts(token).subscribe({
            next: (response: Product[]) => {
              this.products = response;
              this.search = false;
              this.searchCategory = false;
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error al recuperar productos:', error);
              this.products = [];
              this.isLoading = false;
              alert('No se pudieron cargar los productos. Por favor, inicia sesión o intenta de nuevo.');
            }
          });
        }
      }
    }
  
    filtrarPorCategoria(category: string) {
      this.selectedCategory = category;
      this.searchCategory = true;
      this.search = false;
      this.buscarProductos();
    }
  
    irACrear() {
      this.router.navigate(['/create']);
    }
  
    irALogin() {
      this.router.navigate(['/login']);
    }
  
    irAProfile() {
      this.router.navigate(['/profile']);
    }
  
    irAMisChats() {
      this.router.navigate(['/chats']);
    }
  
    irAFavoritos() {
      this.router.navigate(['/favorites']);
    }
  
    irAContacta() {
      this.router.navigate(['/contact']);
    }

    toggleProfileMenu() {
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    }
  
    logout() {
      this.authService.logout();
      this.router.navigate(['/main']);
    }
}

