import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';
import { WebsocketService } from '../../../services/websocket-service/websocket.service';
import { ProductService } from '../../../services/product-service/product.service';
import { TransactionService } from '../../../services/transaction-service/transaction.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription, filter } from 'rxjs';
import { Message } from '../../../models/message.model';

interface User {
  id: number;
  name: string;
  avatar: string;
  status: string;
  online?: boolean;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  proposalForm: FormGroup;
  showProposalForm = false;
  showResponseForm = false;
  respondingToMessage: Message | null = null;
  userProducts: any[] = [];
  private wsSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private userService: UserService,
    private websocketService: WebsocketService,
    private productService: ProductService,
    private transactionService: TransactionService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.proposalForm = this.fb.group({
      productId: [''],
      creditsOffered: [0, [Validators.min(0)]],
      content: ['Propuesta de trueque', Validators.required]
    });
  }

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
        if (user) {
          this.loadUserProducts();
        }
      },
      error: (error) => {
        this.toastr.error('Error al cargar el usuario: ' + error.message);
        this.router.navigate(['/login']);
      },
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

    const initialId = history.state?.conversationId;
    if (initialId) {
      this.loadConversation(initialId);
      this.subscribeToMessages(initialId);
    } else {
      this.router.navigate(['/main']);
    }
  }

  loadUserProducts() {
    const token = localStorage.getItem('token');
    if (!this.currentUser || !token) return;

    this.productService.getProductsByOwner(this.currentUser.id, token).subscribe({
      next: (products) => {
        this.userProducts = products;
      },
      error: (error) => {
        this.toastr.error('Error al cargar los productos: ' + error.message);
      },
    });
  }

  loadConversation(conversationId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.users = [];
    this.negotiationService.getNegotiation(conversationId).subscribe({
      next: (conversation: any) => {
        this.conversation = {
          id: conversation.id,
          productId: conversation.productId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          messages: conversation.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            text: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString(),
            type: msg.type,
            productId: msg.productId,
            creditsOffered: msg.creditsOffered,
            isSystem: msg.type === 'SYSTEM',
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
      error: () => {
        this.toastr.error('Error al cargar la conversación');
        this.router.navigate(['/main']);
      },
    });
  }

  subscribeToMessages(conversationId: number) {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();

    this.websocketService.connect().subscribe({
      next: (connected) => {
        if (connected) {
          this.wsSubscription = this.websocketService
            .subscribeToConversation(conversationId)
            .subscribe({
              next: (message: any) => {
                if (message.senderId !== this.currentUser?.id) {
                  this.messages.push({
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    text: message.content,
                    time: new Date(message.timestamp).toLocaleTimeString(),
                    type: message.type,
                    productId: message.productId,
                    creditsOffered: message.creditsOffered,
                    isSystem: message.type === 'SYSTEM',
                  });
                  this.messages = [...this.messages];
                  this.scrollToBottom();
                }
              },
              error: (error) => this.toastr.error('Error en la conexión WebSocket: ' + error.message),
            });
        } else {
          this.toastr.error('No se pudo conectar al WebSocket');
        }
      },
      error: (error) => this.toastr.error('Error al conectar al WebSocket: ' + error.message),
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
      conversationId: this.conversation.id,
      senderId: this.currentUser.id,
      text: this.newMessage,
      time: new Date().toLocaleTimeString(),
      type: 'TEXT',
      isSystem: false,
    };

    this.messages.push(tempMessage);
    this.scrollToBottom();
    const messageToSend = this.newMessage;
    this.newMessage = '';

    this.negotiationService
      .sendMessage(this.conversation.id, messageToSend, 'TEXT')
      .subscribe({
        next: (response) => {
          const index = this.messages.findIndex(m => m.id === tempMessage.id);
          this.messages[index] = {
            ...tempMessage,
            id: response.id,
            time: new Date(response.timestamp).toLocaleTimeString(),
          };
        },
        error: () => {
          this.messages = this.messages.filter((msg) => msg !== tempMessage);
          this.newMessage = messageToSend;
          this.toastr.error('Error al enviar el mensaje');
        },
      });
  }

  openProposalForm() {
    this.showProposalForm = true;
    this.showResponseForm = false;
    this.respondingToMessage = null;
    this.proposalForm.reset({ productId: '', creditsOffered: 0, content: 'Propuesta de trueque' });
  }

  openResponseForm(message: Message) {
    this.showResponseForm = true;
    this.showProposalForm = false;
    this.respondingToMessage = message;
    this.proposalForm.reset({ productId: '', creditsOffered: 0, content: 'Respuesta a propuesta' });
  }

  submitProposal() {
    if (this.proposalForm.invalid || !this.conversation || !this.currentUser) {
      this.toastr.error('Formulario inválido');
      return;
    }

    const formValue = this.proposalForm.value;
    const productId = formValue.productId || undefined;
    const creditsOffered = formValue.creditsOffered || 0;
    const type = this.showResponseForm ? 'PROPOSAL_RESPONSE' : 'PROPOSAL';

    if (productId && !this.userProducts.some(p => p.id === productId)) {
      this.toastr.error('El producto seleccionado no es válido');
      return;
    }

    this.negotiationService
      .sendMessage(this.conversation.id, formValue.content, type, productId, creditsOffered)
      .subscribe({
        next: (message) => {
          this.messages.push({
            id: message.id,
            conversationId: this.conversation!.id,
            senderId: this.currentUser!.id,
            text: message.content,
            time: new Date(message.timestamp).toLocaleTimeString(),
            type: message.type,
            productId: message.productId,
            creditsOffered: message.creditsOffered,
            isSystem: message.type === 'SYSTEM',
          });
          this.showProposalForm = false;
          this.showResponseForm = false;
          this.respondingToMessage = null;
          this.proposalForm.reset();
          this.scrollToBottom();
          this.toastr.success(type === 'PROPOSAL' ? 'Propuesta enviada' : 'Respuesta enviada');
        },
        error: (error) => {
          this.toastr.error(`Error al enviar ${type === 'PROPOSAL' ? 'la propuesta' : 'la respuesta'}: ${error.message}`);
        },
      });
  }

  acceptTransaction(transactionId: number) {
    this.transactionService
      .updateTransactionStatus(transactionId, 'ACCEPTED', this.proposalForm.value.productId)
      .subscribe({
        next: () => {
          this.messages.push({
            id: Date.now(),
            conversationId: this.conversation!.id,
            senderId: 0,
            text: `Transacción ${transactionId} aceptada`,
            time: new Date().toLocaleTimeString(),
            type: 'SYSTEM',
            isSystem: true,
          });
          this.scrollToBottom();
          this.toastr.success('Transacción aceptada');
        },
        error: (error) => this.toastr.error('Error al aceptar la transacción: ' + error.message),
      });
  }

  rejectTransaction(transactionId: number) {
    this.transactionService
      .updateTransactionStatus(transactionId, 'REJECTED')
      .subscribe({
        next: () => {
          this.messages.push({
            id: Date.now(),
            conversationId: this.conversation!.id,
            senderId: 0,
            text: `Transacción ${transactionId} rechazada`,
            time: new Date().toLocaleTimeString(),
            type: 'SYSTEM',
            isSystem: true,
          });
          this.scrollToBottom();
          this.toastr.success('Transacción rechazada');
        },
        error: (error) => this.toastr.error('Error al rechazar la transacción: ' + error.message),
      });
  }

  showTransactionDetails(transactionId: number) {
    this.transactionService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        this.toastr.info(`Detalles de la transacción ${transactionId}: ${JSON.stringify(transaction)}`);
      },
      error: (error) => this.toastr.error('Error al obtener los detalles: ' + error.message),
    });
  }

  extractTransactionId(content: string): number {
    const match = content.match(/Transacción creada con ID: (\d+)/);
    return match ? +match[1] : 0;
  }

  isCurrentUser(senderId: number): boolean {
    return senderId === this.currentUser?.id;
  }

  getMessageSender(senderId: number): User | undefined {
    return senderId === this.currentUser?.id
      ? this.currentUser
      : this.users.find((u) => u.id === senderId);
  }

  getProductTitle(productId: string): string {
    const product = this.userProducts.find(p => p.id === productId);
    return product ? product.title : 'Producto desconocido';
  }

  selectUser(user: User) {
    this.router.navigate(['/chat'], { state: { conversationId: user.id } });
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