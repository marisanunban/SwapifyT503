import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
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
  latitude?: number;
  longitude?: number;
  ownerLocation?: string;
  ownerUsername?: string;
  ownerRating?: number;
  ownerReviewCount?: number;
}

export interface User {
  id: number;
  username: string;
  credits: number;
  profilePicture?: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  user: User | null = null;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      console.error('No se proporcionó un ID de producto');
      this.router.navigate(['/main']);
    }
  }

  loadProduct(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible');
      alert('Por favor, inicia sesión para ver los detalles del producto.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.productService.getProductById(productId, token).subscribe({
      next: (product: Product) => {
        this.product = product;
        this.fetchConversation();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.isLoading = false;
        alert('No se pudo cargar el producto. Inténtalo de nuevo.');
        this.router.navigate(['/main']);
      }
    });
  }

  fetchConversation() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id && this.product?.id) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conversations) => {
          const conversation = conversations.find(conv => conv.productId === this.product?.id.toString() && conv.status === 'ACTIVE');
          if (this.product && conversation) {
            this.product = { ...this.product, conversation: { id: conversation.id } };
          }
        },
        error: (error) => {
          console.error('Error al obtener conversaciones:', error);
        }
      });
    }
  }

  startChat(productId: number) {
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
        if (this.product) {
          this.product = { ...this.product, conversation: { id: conversationId } };
        }
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

  goBack() {
    this.router.navigate(['/main']);
  }
}