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
  user: { id: number; username: string; credits: number; locationName: string} | null = null;
  products: any[] = [];
  search: boolean = false;
  searchKeyword: string = '';
  conversations: any[] = [];
  otherUserNames: { [conversationId: number]: string } = {};
  isSearchActive: boolean = false; // Controla si se muestran los resultados de búsqueda
  isCategoryActive: boolean = false; // Controla si se muestran los resultados de la categoría
  selectedCategory: string = '';
  searchCategory = false; // Controla si se muestran los resultados de búsqueda por categoría
  searchInLocality = '';

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
          this.user = profile; // Asigna el perfil del usuario
          console.log('Perfil del usuario cargado:', this.user);
        },
        error: (error) => {
          console.error('Error al cargar el perfil del usuario:', error);
        }
      });
    }
    this.recogerProductos();
  }

  filtrarPorCategoria(categoria: string): void {
    this.productService.getProductsByCategory(categoria).subscribe({
      next: (response) => {
        this.products = response;
        this.searchCategory = true; // Mostrar los resultados de búsqueda por categoría
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
  
    // Paso 1: Buscar productos por palabra clave
    this.productService.searchProducts(this.searchKeyword).subscribe(
      (response) => {
        let filteredProducts = response; // Productos encontrados por palabra clave
        console.log('Productos encontrados por palabra clave:', filteredProducts);
  
        // Paso 2: Filtrar por categoría si se ha seleccionado
        if (this.selectedCategory) {
          filteredProducts = filteredProducts.filter(product => product.category === this.selectedCategory);
          console.log('Productos filtrados por categoría:', filteredProducts);
        }
  
        // Paso 3: Filtrar por localización si se ha marcado la casilla
        if (this.searchInLocality) {
          const userLocation = this.user?.locationName;
          if (!userLocation) {
            console.warn('No se ha especificado la ubicación del usuario.');
            return;
          }
  
          // Llamar al servicio para obtener productos por localización
          this.productService.getProductsByLocation(userLocation).subscribe(
            (locationFilteredProducts) => {
              // Filtrar los productos ya obtenidos por los IDs devueltos por el backend
              const locationFilteredIds = new Set(locationFilteredProducts.map(p => p.id));
              filteredProducts = filteredProducts.filter(product => locationFilteredIds.has(product.id));
              console.log('Productos filtrados por localización:', filteredProducts);
  
              // Actualizar la lista de productos y mostrar los resultados
              this.products = filteredProducts;
              this.search = true; // Mostrar los resultados de búsqueda
              this.searchCategory = false; // Ocultar los resultados de búsqueda por categoría
            },
            (error) => {
              console.error('Error al filtrar productos por localización:', error);
            }
          );
        } else {
          // Si no se filtra por localización, actualizar directamente
          this.products = filteredProducts;
          this.search = true; // Mostrar los resultados de búsqueda
          this.searchCategory = false; // Ocultar los resultados de búsqueda por categoría
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

    // Verificar si ya existe una conversación
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
    this.router.navigate(['/main']);
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  irAProfile() {
    this.router.navigate(['/profile']);
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
}