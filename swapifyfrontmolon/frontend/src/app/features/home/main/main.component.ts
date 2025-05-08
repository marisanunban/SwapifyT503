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
      center,
      zoom: 12,
    });
    this.addAutocomplete();
    this.addMarker(center);
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
    if (this.map) {
      new google.maps.Marker({
        position: latLng,
        map: this.map,
      });
      this.tempSelectedLatLng = {
        lat: latLng.lat(),
        lng: latLng.lng(),
      };
    }
  }

  centerMapOnLocation() {
    if (this.tempSelectedLatLng) {
      this.map.setCenter(this.tempSelectedLatLng);
    }
  }

  updateRadius() {
    // Método vacío, ya que radius se usa directamente
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

    const searchParams: any = {
      keyword: this.searchKeyword || undefined,
      radiusKm: this.radius,
    };

    if (this.tempSelectedLatLng) {
      searchParams.latitude = this.tempSelectedLatLng.lat;
      searchParams.longitude = this.tempSelectedLatLng.lng;
    }

    if (this.selectedCategory) {
      searchParams.category = this.selectedCategory;
    }

    this.isLoading = true;
    this.productService.searchProductsByCoordinates(
      searchParams.latitude,
      searchParams.longitude,
      searchParams.radiusKm,
      searchParams.category,
      searchParams.keyword
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
        alert('Hubo un error al buscar productos. Por favor, intenta de nuevo más tarde.');
        this.products = [];
        this.isLoading = false;
      }
    });
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
        // Actualizar la lista de productos para reflejar la nueva conversación
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

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/main']);
  }
}