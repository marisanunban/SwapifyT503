import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';

interface User {
  id: number;
  name: string;
  avatar: string;
  status: string;
  online?: boolean;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  isSystem?: boolean;
}

interface Conversation {
  id: number;
  productId: string;
  buyerId: number;
  sellerId: number;
  messages: Message[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  newMessage = '';
  currentUser: User | null = null;
  conversation: Conversation | null = null;
  users: User[] = [];
  messages: Message[] = [];
  selectedChat: { name: string; description: string; avatar: string; participants: number } = {
    name: '',
    description: '',
    avatar: 'assets/placeholder.svg', // Update to valid path
    participants: 2,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Obtener usuario autenticado
    this.authService.user$.subscribe((user) => {
      this.currentUser = user
        ? {
            id: user.id,
            name: user.username,
            avatar: 'assets/placeholder.svg', // Update to valid path
            status: 'Online',
            online: true,
          }
        : null;
    });

    // Obtener conversationId del estado de navegación
    const state = history.state; // Use history.state instead of getCurrentNavigation
    const conversationId = state?.conversationId;

    if (!conversationId) {
      console.error('No conversationId provided');
      this.router.navigate(['/main']);
      return;
    }

    // Cargar la conversación
    this.loadConversation(conversationId);
  }

  loadConversation(conversationId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      this.router.navigate(['/login']);
      return;
    }

    this.negotiationService.getNegotiation(conversationId).subscribe({
      next: (conversation: any) => {
        this.conversation = {
          id: conversation.id,
          productId: conversation.productId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          messages: conversation.messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            text: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString(),
            isSystem: msg.type !== 'TEXT',
          })),
        };

        // Configurar selectedChat
        this.selectedChat = {
          name: `Negociación por producto ${conversation.productId}`,
          description: 'Chat entre comprador y vendedor',
          avatar: 'assets/placeholder.svg', // Update to valid path
          participants: 2,
        };

        // Cargar detalles del comprador
        this.userService.getUserById(conversation.buyerId, token).subscribe({
          next: (buyer: any) => {
            this.users.push({
              id: buyer.id,
              name: buyer.username,
              avatar: 'assets/placeholder.svg', // Update to valid path
              status: 'Online',
              online: true,
            });
          },
          error: (err) => {
            console.error('Error fetching buyer:', err);
            this.users.push({
              id: conversation.buyerId,
              name: `Comprador ${conversation.buyerId}`,
              avatar: 'assets/placeholder.svg', // Update to valid path
              status: 'Desconocido',
              online: false,
            });
          },
        });

        // Cargar detalles del vendedor
        this.userService.getUserById(conversation.sellerId, token).subscribe({
          next: (seller: any) => {
            this.users.push({
              id: seller.id,
              name: seller.username,
              avatar: 'assets/placeholder.svg', // Update to valid path
              status: 'Online',
              online: true,
            });
          },
          error: (err) => {
            console.error('Error fetching seller:', err);
            this.users.push({
              id: conversation.sellerId,
              name: `Vendedor ${conversation.sellerId}`,
              avatar: 'assets/placeholder.svg', // Update to valid path
              status: 'Desconocido',
              online: false,
            });
          },
        });

        this.messages = this.conversation.messages;
      },
      error: (error) => {
        console.error('Error al cargar la conversación:', error);
        this.router.navigate(['/main']);
      },
    });
  }

  sendMessage() {
    if (this.newMessage.trim() === '' || !this.conversation) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      this.router.navigate(['/login']);
      return;
    }

    this.negotiationService
      .sendMessage(this.conversation.id, this.newMessage, 'TEXT')
      .subscribe({
        next: (message: any) => {
          this.messages.push({
            id: message.id,
            senderId: message.senderId,
            text: message.content,
            time: new Date(message.timestamp).toLocaleTimeString(),
            isSystem: message.type !== 'TEXT',
          });
          this.newMessage = '';
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
        },
      });
  }

  isCurrentUser(senderId: number): boolean {
    return senderId === this.currentUser?.id;
  }

  getMessageSender(senderId: number): User | undefined {
    if (senderId === this.currentUser?.id) {
      return this.currentUser;
    }
    return this.users.find((user) => user.id === senderId);
  }

  selectUser(user: User) {
    console.log('Usuario seleccionado:', user);
  }
}