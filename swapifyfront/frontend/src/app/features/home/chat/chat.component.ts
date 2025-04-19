import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';
import { WebsocketService } from '../../../services/websocket-service/websocket.service';
import { Subscription, filter } from 'rxjs';

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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  newMessage = '';
  currentUser: User | null = null;
  conversation: Conversation | null = null;
  users: User[] = [];
  messages: Message[] = [];
  selectedChat = {
    name: '',
    description: '',
    avatar: 'assets/placeholder.svg',
    participants: 2,
  };
  private wsSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private userService: UserService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe({
      next: (user) => {
        this.currentUser = user
          ? {
              id: user.id,
              name: user.username,
              avatar: 'assets/placeholder.svg',
              status: 'Online',
              online: true,
            }
          : null;
      },
      error: (error) => console.error('Error fetching user:', error),
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const newConversationId = history.state?.conversationId;
        if (!newConversationId) {
          this.router.navigate(['/main']);
          return;
        }

        if (!this.conversation || this.conversation.id !== newConversationId) {
          this.loadConversation(newConversationId);
          this.subscribeToMessages(newConversationId);
        }
      });

    // Carga inicial
    const initialId = history.state?.conversationId;
    if (initialId) {
      this.loadConversation(initialId);
      this.subscribeToMessages(initialId);
    } else {
      this.router.navigate(['/main']);
    }
  }

  loadConversation(conversationId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.users = []; // Limpiar usuarios para nueva conversación
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
            text: msg.content, // Usar "content" como en MessageDto
            time: new Date(msg.timestamp).toLocaleTimeString(),
            isSystem: msg.type !== 'TEXT',
          })),
        };

        this.selectedChat = {
          name: `Negociación por producto ${conversation.productId}`,
          description: 'Chat entre comprador y vendedor',
          avatar: 'assets/placeholder.svg',
          participants: 2,
        };

        this.userService.getUserById(conversation.buyerId, token).subscribe({
          next: (buyer: any) => {
            this.users.push({
              id: buyer.id,
              name: buyer.username,
              avatar: 'assets/placeholder.svg',
              status: 'Online',
              online: true,
            });
          },
          error: () =>
            this.users.push({
              id: conversation.buyerId,
              name: `Comprador ${conversation.buyerId}`,
              avatar: 'assets/placeholder.svg',
              status: 'Desconocido',
              online: false,
            }),
        });

        this.userService.getUserById(conversation.sellerId, token).subscribe({
          next: (seller: any) => {
            this.users.push({
              id: seller.id,
              name: seller.username,
              avatar: 'assets/placeholder.svg',
              status: 'Online',
              online: true,
            });
          },
          error: () =>
            this.users.push({
              id: conversation.sellerId,
              name: `Vendedor ${conversation.sellerId}`,
              avatar: 'assets/placeholder.svg',
              status: 'Desconocido',
              online: false,
            }),
        });

        this.messages = [...this.conversation.messages];
        this.scrollToBottom();
      },
      error: () => this.router.navigate(['/main']),
    });
  }

  subscribeToMessages(conversationId: number) {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();

    // Esperar a que la conexión WebSocket esté lista
    this.websocketService.connect().subscribe({
      next: (connected) => {
        if (connected) {
          console.log('WebSocket connection established, subscribing to messages');
          this.wsSubscription = this.websocketService
            .subscribeToConversation(conversationId)
            .subscribe({
              next: (message: any) => {
                console.log('Mensaje recibido:', message);
                if (message.senderId !== this.currentUser?.id) { // Filtrar mensajes del propio usuario
                  this.messages.push({
                    id: message.id,
                    senderId: message.senderId,
                    text: message.content, // Usar "content" como en MessageDto
                    time: new Date(message.timestamp).toLocaleTimeString(),
                    isSystem: message.type !== 'TEXT',
                  });
                  this.messages = [...this.messages]; // Forzar actualización de la UI
                  this.scrollToBottom();
                }
              },
              error: (error) => console.error('WebSocket subscription error:', error),
            });
        } else {
          console.error('Failed to establish WebSocket connection');
        }
      },
      error: (error) => console.error('WebSocket connection error:', error),
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation || !this.currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const tempMessage: Message = {
      id: Date.now(),
      senderId: this.currentUser.id,
      text: this.newMessage,
      time: new Date().toLocaleTimeString(),
      isSystem: false,
    };

    this.messages.push(tempMessage);
    this.scrollToBottom();
    const messageToSend = this.newMessage;
    this.newMessage = '';

    this.negotiationService
      .sendMessage(this.conversation.id, messageToSend, 'TEXT')
      .subscribe({
        error: () => {
          this.messages = this.messages.filter((msg) => msg !== tempMessage);
          this.newMessage = messageToSend;
        },
      });
  }

  isCurrentUser(senderId: number): boolean {
    return senderId === this.currentUser?.id;
  }

  getMessageSender(senderId: number): User | undefined {
    return senderId === this.currentUser?.id
      ? this.currentUser
      : this.users.find((u) => u.id === senderId);
  }

  selectUser(user: User) {
    console.log('Usuario seleccionado:', user);
    this.selectedChat = {
      name: user.name,
      description: 'Chat con ' + user.name,
      avatar: user.avatar,
      participants: 1,
    };
    this.loadConversation(user.id);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngOnDestroy() {
    this.websocketService.disconnect();
    this.wsSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }
}