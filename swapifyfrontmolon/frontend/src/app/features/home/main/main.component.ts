import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { ProductService } from "../../../services/product-service/product.service"
import { AuthService } from "../../../services/auth-service/auth.service"
import  { Product, Conversation } from "../../../models/product.model"
import  { NegotiationService } from "../../../services/negotiation-service/negotiation.service"
import  { UserService } from "../../../services/user-service/user.service"
import { UserProfile, UserDto } from "../../../models/user.model"

@Component({
  selector: "app-main",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class MainComponent implements OnInit {
  searchKeyword = ""
  selectedCategory = ""
  search = false
  searchCategory = false
  isLoading = false
  products: Product[] = []
  user: UserDto | null = null
  isProfileMenuOpen = false
  radius = 10
  latitude: number | undefined
  longitude: number | undefined

  // Propiedades para la barra lateral de búsqueda
  showSearchSidebar = false
  locationInput = ""

  // Propiedades para las secciones
  recentlyViewed: Product[] = []
  similarProducts: Product[] = []

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Cargar usuario
    this.authService.user$.subscribe((user) => {
      this.user = user as UserDto | null
      if (!this.user) {
        // No redirigir automáticamente al login
        // this.router.navigate(['/login']);
      } else {
        // Cargar perfil completo del usuario para obtener profilePictureUrl
        const token = localStorage.getItem("token") ?? undefined
        if (token) {
          this.userService.getUserProfile(token).subscribe({
            next: (profile: UserProfile) => {
              if (this.user) {
                this.user = { ...this.user, profilePictureUrl: profile.profilePictureUrl }
              }
            },
            error: (error) => {
              console.error("Error al cargar el perfil del usuario:", error)
            },
          })
        }
      }
    })

    // Cargar productos iniciales
    this.loadProducts()

    // Cargar productos vistos recientemente
    this.loadRecentlyViewed()

    // Cargar productos similares (simulación o backend)
    this.loadSimilarProducts()

    // Cargar conversaciones del usuario para asociarlas a los productos
    this.loadUserConversations()
  }

  // Cargar todos los productos
  loadProducts(): void {
    this.isLoading = true
    const token = localStorage.getItem("token") ?? undefined
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        this.products = products
        this.isLoading = false
        // Actualizar conversaciones para los productos
        this.updateProductConversations()
      },
      error: (error) => {
        console.error("Error al cargar productos:", error)
        this.isLoading = false
      },
    })
  }

  // Buscar productos por palabra clave
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
  }

  // Filtrar productos por categoría
  filtrarPorCategoria(category: string): void {
    this.searchCategory = true
    this.search = false
    this.isLoading = true
    this.selectedCategory = category
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products
        this.isLoading = false
        this.updateProductConversations()
      },
      error: (error) => {
        console.error("Error al filtrar por categoría:", error)
        this.isLoading = false
      },
    })
  }

  // Cargar conversaciones del usuario y asociarlas a los productos
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

  // Actualizar las conversaciones asociadas a los productos
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

  // Asignar conversaciones a los productos
  applyConversationsToProducts(conversations: Conversation[]): void {
    this.products = this.products.map((product) => {
      const conversation = conversations.find((conv) => conv.productId === product.id.toString())
      return conversation ? { ...product, conversation } : product
    })
    this.recentlyViewed = this.recentlyViewed.map((product) => {
      const conversation = conversations.find((conv) => conv.productId === product.id.toString())
      return conversation ? { ...product, conversation } : product
    })
    this.similarProducts = this.similarProducts.map((product) => {
      const conversation = conversations.find((conv) => conv.productId === product.id.toString())
      return conversation ? { ...product, conversation } : product
    })
  }

  // Navegar a la página de creación de producto
  irACrear(): void {
    this.router.navigate(["/create-product"])
  }

  // Navegar a la página de login
  irALogin(): void {
    this.router.navigate(["/login"])
  }

  // Navegar al perfil del usuario
  irAProfile(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/profile"])
  }

  // Navegar a los chats del usuario
  irAMisChats(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/chats"])
  }

  // Navegar a los favoritos del usuario
  irAFavoritos(): void {
    this.isProfileMenuOpen = false
    this.router.navigate(["/favorites"])
  }

  // Navegar a la página de contacto
  irAContacta(): void {
    this.router.navigate(["/contact"])
  }

  // Cerrar sesión
  logout(): void {
    this.authService.logout()
    this.isProfileMenuOpen = false
    this.router.navigate(["/login"])
  }

  // Alternar el menú de perfil
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

  // Navegar al detalle de un producto
  goToProductDetail(productId: number): void {
    const product = this.products.find((p) => p.id === productId)
    if (product) {
      this.addToRecentlyViewed(product)
    }
    this.router.navigate([`/product/${productId}`])
  }

  // Iniciar una negociación
  startNegotiation(productId: number): void {
    if (!this.user) {
      this.router.navigate(["/login"])
      return
    }
    console.log("Iniciando negociación para el producto:", productId)
    this.negotiationService.startNegotiation(productId.toString()).subscribe({
      next: (conversation) => {
        console.log("Conversación creada:", conversation)
        if (!conversation || !conversation.id) {
          console.error("No se recibió un ID de conversación válido:", conversation)
          alert("No se pudo iniciar la conversación. Inténtalo de nuevo.")
          return
        }
        // Actualizar el producto con la nueva conversación
        this.products = this.products.map((p) => (p.id === productId ? { ...p, conversation } : p))
        this.recentlyViewed = this.recentlyViewed.map((p) => (p.id === productId ? { ...p, conversation } : p))
        this.similarProducts = this.similarProducts.map((p) => (p.id === productId ? { ...p, conversation } : p))
        // Navegar al chat usando el objeto state
        this.router.navigate(["/chat"], { state: { conversationId: conversation.id } }).then((success) => {
          if (!success) {
            console.error("La navegación al chat falló")
            alert("No se pudo navegar al chat. Verifica la configuración de las rutas.")
          } else {
            console.log("Navegación exitosa a /chat con conversationId:", conversation.id)
          }
        })
      },
      error: (error) => {
        console.error("Error al iniciar negociación:", error)
        alert("Error al iniciar la conversación. Por favor, intenta de nuevo.")
      },
    })
  }

  // Ir a un chat existente
  goToChat(conversationId: number): void {
    console.log("Intentando navegar a /chat con conversationId:", conversationId)
    this.router.navigate(["/chat"], { state: { conversationId } }).then((success) => {
      if (!success) {
        console.error("La navegación al chat falló para conversationId:", conversationId)
        alert("No se pudo navegar al chat. Verifica la configuración de las rutas.")
      } else {
        console.log("Navegación exitosa a /chat con conversationId:", conversationId)
      }
    })
  }

  // Añadir un producto a "Vistos Recientemente"
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

  // Cargar "Vistos Recientemente" desde localStorage
  loadRecentlyViewed(): void {
    const saved = localStorage.getItem("recentlyViewed")
    if (saved) {
      this.recentlyViewed = JSON.parse(saved)
      // Asegurarnos de que los productos tengan las conversaciones actualizadas
      this.updateProductConversations()
    }
  }

  // Cargar "Más como estos" (simulación)
  loadSimilarProducts(): void {
    // Simulación: Tomar algunos productos aleatorios de la lista
    setTimeout(() => {
      this.similarProducts = this.products.slice(0, 4)
    }, 1000)
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
