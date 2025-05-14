import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';

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

declare var google: any;

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  user: User | null = null;
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
    private negotiationService: NegotiationService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.recuperarProductos();
    });
  }

  recuperarProductos() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible. No se pueden recuperar productos.');
      this.products = [];
      return;
    }

    this.isLoading = true;
    this.productService.getAllProducts(token).subscribe({
      next: (products: Product[]) => {
        this.products = products;
        this.fetchConversations();
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
      center: new google.maps.LatLng(center.lat, center.lng),
      zoom: 12,
    });
    this.addAutocomplete();
    this.addMarker(center);
    this.addClickListener();
    this.drawCircle();
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

    console.log('latLng recibido en addMarker:', latLng);

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

    new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: this.map,
    });

    this.tempSelectedLatLng = { lat, lng };
    this.drawCircle();
  }

  drawCircle() {
    if (this.map && this.tempSelectedLatLng) {
      if (this.map.circle) {
        this.map.circle.setMap(null);
      }
      this.map.circle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: this.map,
        center: new google.maps.LatLng(this.tempSelectedLatLng.lat, this.tempSelectedLatLng.lng),
        radius: this.radius * 1000,
      });
      this.map.fitBounds(this.map.circle.getBounds());
    }
  }

  addClickListener() {
    if (this.map) {
      this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng;
        this.addMarker(latLng);
        this.buscarProductos();
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
    this.router.navigate(['/chat']); // Ajustado para coincidir con la ruta existente
  }

  irAFavoritos() {
    this.router.navigate(['/favorites']);
  }

  irAContacta() {
    this.router.navigate(['/contact']);
  }

  startChat(productId: number) {
    console.log('Iniciando chat para producto:', productId);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      alert('Por favor, inicia sesión para iniciar un chat.');
      return;
    }

    this.isLoading = true;
    this.negotiationService.startNegotiation(productId.toString()).subscribe({
      next: (conversation) => {
        const conversationId = conversation.id;
        this.router.navigate(['/chat'], { state: { conversationId } });
        this.isLoading = false;
        this.products = this.products.map(product => {
          if (product.id === productId) {
            return { ...product, conversation: { id: conversationId } };
          }
          return product;
        });
      },
      error: (error) => {
        console.error('Error al iniciar el chat:', error);
        alert('No se pudo iniciar el chat. Inténtalo de nuevo.');
        this.isLoading = false;
      }
    });
  }

  goToChat(conversationId: number) {
    this.router.navigate(['/chat'], { state: { conversationId } });
  }

  goToProductDetail(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  toggleFavorite(productId: number) {
    console.log(`Toggling favorite for product ID: ${productId}`);
    // Aquí puedes implementar la lógica para añadir o quitar el producto de favoritos
    // Por ejemplo, podrías tener un servicio FavoriteService para manejar esto
    alert('Funcionalidad de favoritos aún no implementada.');
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/main']);
  }
}