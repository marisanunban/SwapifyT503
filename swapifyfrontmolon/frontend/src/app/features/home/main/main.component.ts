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
  selector: "app-main",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class MainComponent implements OnInit {
  searchKeyword: string = '';
  selectedCategory: string = '';
  search: boolean = false;
  searchCategory: boolean = false;
  isLoading: boolean = false;
  products: Product[] = [];
  trendingProducts: Product[] = [];
  user: UserDto | null = null;
  isProfileMenuOpen: boolean = false;
  isLocationModalOpen: boolean = false;
  radius: number = 10;
  latitude: number = 40.416775;
  recentlyViewed: Product[] = [];
  similarProducts: Product[] = [];
  map: any;
  marker: any;
      if (!this.user) {
        // No redirigir automáticamente al login
        // this.router.navigate(['/login']);
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
          this.loadFavorites(token);
        }
      }
    })

    this.loadProducts();
    this.loadTrendingProducts();
    this.loadRecentlyViewed();
    this.loadSimilarProducts();
    this.loadUserConversations();
  }

  loadFavorites(token: string): void {
    this.productService.getUserFavorites(token).subscribe({
      next: (favorites) => {
        this.updateFavoriteStatus(favorites);
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
      }
    });
  }

  updateFavoriteStatus(favorites: Product[]): void {
    const favoriteIds = new Set(favorites.map(f => f.id));
    this.products = this.products.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.trendingProducts = this.trendingProducts.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.recentlyViewed = this.recentlyViewed.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.similarProducts = this.similarProducts.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
  }

  loadTrendingProducts(): void {
    this.productService.getTrendingProducts().subscribe({
      next: (products) => {
        this.trendingProducts = products;
        this.updateProductConversations();
        const token = localStorage.getItem('token');
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos trending:', error);
      }
    });
  }

  toggleFavorite(product: Product): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Por favor, inicia sesión para gestionar favoritos.');
      return;
    }

    if (product.isFavorite) {
      this.productService.removeFavorite(product.id, token).subscribe({
        next: () => {
          product.isFavorite = false;
          product.favoriteCount = (product.favoriteCount || 1) - 1;
          this.updateFavoriteInLists(product);
        },
        error: (error) => {
          console.error('Error al eliminar favorito:', error);
          alert('No se pudo eliminar el favorito. Inténtalo de nuevo.');
        }
      });
    } else {
      this.productService.addFavorite(product.id, token).subscribe({
        next: () => {
          product.isFavorite = true;
          product.favoriteCount = (product.favoriteCount || 0) + 1;
          this.updateFavoriteInLists(product);
        },
        error: (error) => {
          console.error('Error al añadir favorito:', error);
          alert('No se pudo añadir el favorito. Inténtalo de nuevo.');
        }
      });
    }
  }

  updateFavoriteInLists(updatedProduct: Product): void {
    const updateList = (list: Product[]) =>
      list.map(p => p.id === updatedProduct.id ? { ...p, isFavorite: updatedProduct.isFavorite, favoriteCount: updatedProduct.favoriteCount } : p);

    this.products = updateList(this.products);
    this.trendingProducts = updateList(this.trendingProducts);
    this.recentlyViewed = updateList(this.recentlyViewed);
    this.similarProducts = updateList(this.similarProducts);
  }

  initMap(): void {
    const defaultLocation = { lat: this.latitude, lng: this.longitude };
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
        },
        (error) => {
          console.error('Error al obtener la ubicación del usuario:', error);
          alert('No se pudo obtener tu ubicación. Usando Madrid como ubicación predeterminada.');
          this.addMarker(this.latitude, this.longitude);
        }
      );
    } else {
      alert('La geolocalización no está soportada por tu navegador. Usando Madrid como ubicación predeterminada.');
      this.addMarker(this.latitude, this.longitude);
    }

    this.map.addListener('click', (event: any) => {
      this.latitude = event.latLng.lat();
      this.longitude = event.latLng.lng();
      this.addMarker(this.latitude, this.longitude);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: this.latitude, lng: this.longitude } }, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const locationInput = document.getElementById('locationInput') as HTMLInputElement;
          locationInput.value = results[0].formatted_address;
        }
      });
    });
  }

  addMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setMap(null);
    }
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
      } else {
        alert('No se pudo encontrar la ubicación. Inténtalo de nuevo.');
      }
    });
  }

  updateRadius(): void {
    // Implementar si es necesario
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
          const token = localStorage.getItem('token');
          if (token) {
            this.loadFavorites(token);
          }
        },
        error: (error) => {
          console.error('Error al buscar por coordenadas:', error);
          this.isLoading = false;
          alert('Error al buscar productos por ubicación. Por favor, intenta de nuevo.');
        }
      });
  }

  loadProducts(): void {
    this.isLoading = true
    const token = localStorage.getItem("token") ?? undefined
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error("Error al cargar productos:", error)
        this.isLoading = false
      },
    })
  }

  buscarProductos(): void {
    if (!this.searchKeyword.trim()) {
      this.search = false
      this.loadProducts()
      return
    }
    this.isLoading = true
    this.search = true
    this.searchCategory = false

    console.log("Buscando productos con:", {
      keyword: this.searchKeyword,
      category: this.selectedCategory,
      location: this.latitude && this.longitude ? `${this.latitude},${this.longitude}` : null,
      radius: this.radius,
    })

    // Si tenemos coordenadas, usar búsqueda por coordenadas
    if (this.latitude && this.longitude) {
      this.productService
        .searchProductsByCoordinates(
          this.latitude,
          this.longitude,
          this.radius,
          this.selectedCategory,
          this.searchKeyword,
        )
        .subscribe({
          next: (products) => {
            this.products = products
            this.isLoading = false
            this.updateProductConversations()
            this.showSearchSidebar = false
            console.log(`Encontrados ${products.length} productos por coordenadas`)
          },
          error: (error) => {
            console.error("Error al buscar por coordenadas:", error)
            this.isLoading = false
          },
        })
    } else {
      // Si no tenemos coordenadas, usar búsqueda normal
      this.productService
        .searchProducts(this.searchKeyword, undefined, undefined, this.radius, this.selectedCategory)
        .subscribe({
          next: (products) => {
            this.products = products
            this.isLoading = false
            this.updateProductConversations()
            this.showSearchSidebar = false
            console.log(`Encontrados ${products.length} productos por keyword/categoría`)
          },
          error: (error) => {
            console.error("Error al buscar productos:", error)
            this.isLoading = false
          },
        })
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
          const token = localStorage.getItem('token');
          if (token) {
            this.loadFavorites(token);
          }
        },
        error: (error) => {
          console.error('Error al buscar productos:', error);
          this.isLoading = false;
        }
      });
  }

  filtrarPorCategoria(category: string): void {
    this.searchCategory = true
    this.search = false
    this.isLoading = true
    this.selectedCategory = category
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
        const token = localStorage.getItem('token');
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error("Error al filtrar por categoría:", error)
        this.isLoading = false
      },
    })
  }

  loadUserConversations(): void {
    if (!this.user) return
    this.negotiationService.getUserConversations().subscribe({
      next: (conversations) => {
        this.updateProductConversations(conversations)
      },
      error: (error) => {
        console.error("Error al cargar conversaciones:", error)
      },
    })
  }

  updateProductConversations(conversations?: Conversation[]): void {
    if (!conversations) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conv) => {
          this.applyConversationsToProducts(conv)
        },
        error: (error) => {
          console.error("Error al actualizar conversaciones:", error)
        },
      })
    } else {
      this.applyConversationsToProducts(conversations)
    }
  }

  applyConversationsToProducts(conversations: Conversation[]): void {
    this.products = this.products.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
    this.trendingProducts = this.trendingProducts.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
    this.recentlyViewed = this.recentlyViewed.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
    this.similarProducts = this.similarProducts.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
  }

  irACrear(): void {
    this.router.navigate(["/create-product"])
  }

  irALogin(): void {
    this.router.navigate(["/login"])
  }

  irAProfile(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/profile"])
  }

  irAMisChats(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/chats"])
  }

  irAFavoritos(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/favorites"])
  }

  irAContacta(): void {
    this.router.navigate(["/contact"])
  }

  logout(): void {
    this.authService.logout()
    this.isProfileMenuOpen = false
    this.router.navigate(["/login"])
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen
  }

  // Alternar la barra lateral de búsqueda
  toggleSearchSidebar(): void {
    this.showSearchSidebar = !this.showSearchSidebar
  }

  // Abrir la barra lateral específicamente para la sección de ubicación
  openLocationSidebar(): void {
    this.showSearchSidebar = true
    // Aquí podrías añadir lógica para desplazarse automáticamente a la sección de ubicación
    setTimeout(() => {
      const locationSection = document.querySelector(".sidebar-section:nth-child(2)")
      if (locationSection) {
        locationSection.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  // Cerrar la barra lateral de búsqueda
  closeSearchSidebar(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.showSearchSidebar = false
    }
  }

  // Centrar el mapa en la ubicación
  centerMapOnLocation(source = "sidebar"): void {
    const input = source === "sidebar" ? this.locationInput : ""

    // Aquí deberías integrar una API de geocodificación (como Google Maps Geocoding API)
    // Por ahora, simularemos las coordenadas (Madrid como ejemplo)
    if (input.toLowerCase().includes("madrid")) {
      this.latitude = 40.416775
      this.longitude = -3.70379
    } else if (input.toLowerCase().includes("barcelona")) {
      this.latitude = 41.385064
      this.longitude = 2.173404
    } else if (input.toLowerCase().includes("valencia")) {
      this.latitude = 39.469907
      this.longitude = -0.376288
    } else if (input.toLowerCase().includes("sevilla")) {
      this.latitude = 37.389092
      this.longitude = -5.984459
    } else {
      // Si no se reconoce la ubicación, usar una ubicación por defecto (Madrid)
      this.latitude = 40.416775
      this.longitude = -3.70379
    }

    console.log("Centrando mapa en:", input, { lat: this.latitude, lng: this.longitude })

    // Aquí deberías actualizar el mapa visual con las nuevas coordenadas
    // Por ejemplo, si estás usando Google Maps:
    // const map = new google.maps.Map(document.getElementById('sidebarMap'), {
    //   center: { lat: this.latitude, lng: this.longitude },
    //   zoom: 12
    // });
  }

  // Actualizar el radio del mapa
  updateRadius(): void {
    console.log("Radio actualizado a:", this.radius)

    // Actualizar la visualización del círculo del radio (simulación)
    setTimeout(() => {
      const circleElement = document.querySelector(".map-circle") as HTMLElement
      if (circleElement) {
        // Ajustar el tamaño del círculo según el radio (simulación visual)
        const scaleFactor = 2 // Factor para convertir km a píxeles (simulación)
        circleElement.style.width = `${this.radius * scaleFactor}px`
        circleElement.style.height = `${this.radius * scaleFactor}px`
      }
    }, 100)
  }

  // Restablecer filtros
  resetFilters(): void {
    this.selectedCategory = ""
    this.radius = 10
    this.latitude = undefined
    this.longitude = undefined
    this.locationInput = ""
  }

  // Aplicar filtros y buscar
  applyFiltersAndSearch(): void {
    this.buscarProductos()
  }

  goToProductDetail(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.addToRecentlyViewed(product)
    }
    this.router.navigate([`/product/${productId}`])
  }

  startNegotiation(productId: string): void {
    if (!this.user) {
      this.router.navigate(["/login"])
      return
    }
    this.negotiationService.startNegotiation(productId).subscribe({
      next: (conversation) => {
        this.products = this.products.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.trendingProducts = this.trendingProducts.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.recentlyViewed = this.recentlyViewed.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.similarProducts = this.similarProducts.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.router.navigate(['/chat'], { state: { conversationId: conversation.id } });
      },
      error: (error) => {
        console.error("Error al iniciar negociación:", error)
        alert("Error al iniciar la conversación. Por favor, intenta de nuevo.")
      },
    })
  }

  goToChat(conversationId: number): void {
    this.router.navigate(['/chat'], { state: { conversationId } });
  }

  addToRecentlyViewed(product: Product): void {
    const index = this.recentlyViewed.findIndex((p) => p.id === product.id)
    if (index === -1) {
      this.recentlyViewed.unshift(product)
      if (this.recentlyViewed.length > 5) {
        this.recentlyViewed.pop()
      }
      localStorage.setItem("recentlyViewed", JSON.stringify(this.recentlyViewed))
    }
  }

  loadRecentlyViewed(): void {
    const saved = localStorage.getItem("recentlyViewed")
    if (saved) {
      this.recentlyViewed = JSON.parse(saved);
      this.updateProductConversations();
      const token = localStorage.getItem('token');
      if (token) {
        this.loadFavorites(token);
      }
    }
  }

  loadSimilarProducts(): void {
    this.similarProducts = this.products.slice(0, 4);
    const token = localStorage.getItem('token');
    if (token) {
      this.loadFavorites(token);
    }
  }

  // Manejar cambio de categoría
  onCategoryChange(category: string): void {
    console.log("Categoría seleccionada:", category)
    this.selectedCategory = category
    // No aplicamos el filtro inmediatamente para permitir combinar con otros filtros
  }

  goToCreateProduct(): void {
    this.router.navigate(["/create"])
  }
}
