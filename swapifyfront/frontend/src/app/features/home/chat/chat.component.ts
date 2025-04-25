import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';
import { WebsocketService } from '../../../services/websocket-service/websocket.service';
import { ProductService } from '../../../services/product-service/product.service';
import { TransactionService } from '../../../services/transaction-service/transaction.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription, filter } from 'rxjs';
import { Message } from '../../../models/message.model';
import { Transaction } from '../../../models/transaction.model';

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
  transactions: { [key: number]: Transaction } = {};
  isAccepting: { [key: number]: boolean } = {};
  isRejecting: { [key: number]: boolean } = {};
  private wsSubscription: Subscription | null = null;
  private wsNotificationSubscription: Subscription | null = null; // Nueva suscripción para notificaciones
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
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.proposalForm = this.fb.group({
      productId: [''],
      creditsOffered: [0, [Validators.min(0)]],
      content: ['Propuesta de trueque', Validators.required],
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
        console.log('Usuario actual cargado:', this.currentUser);
        if (user) {
          this.loadUserProducts();
          // Suscribirse a las notificaciones del usuario
          this.subscribeToUserNotifications(user.id);
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
        this.loadTransactionsFromMessages();
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
                if (message.senderId !== this.currentUser?.id || message.type === 'SYSTEM') {
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
                  if (message.type === 'SYSTEM') {
                    const transactionId = this.getTransactionId(message.text);
                    if (transactionId) {
                      this.loadTransactionState(transactionId);
                    }
                  }
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

  // Nuevo método para suscribirse a las notificaciones del usuario
  subscribeToUserNotifications(userId: number) {
    if (this.wsNotificationSubscription) this.wsNotificationSubscription.unsubscribe();

    this.websocketService.connect().subscribe({
      next: (connected) => {
        if (connected) {
          this.wsNotificationSubscription = this.websocketService
            .subscribeToUserNotifications(userId)
            .subscribe({
              next: (notification: any) => {
                console.log('Notificación recibida para el usuario:', notification);
                const transactionId = notification.transactionId;
                const newStatus = notification.status;

                if (transactionId) {
                  // Actualizar el estado de la transacción
                  this.loadTransactionState(transactionId);
                  this.toastr.info(`La transacción ${transactionId} ha cambiado a estado: ${newStatus}`);
                }
              },
              error: (error) => this.toastr.error('Error al recibir notificaciones WebSocket: ' + error.message),
            });
        } else {
          this.toastr.error('No se pudo conectar al WebSocket para notificaciones');
        }
      },
      error: (error) => this.toastr.error('Error al conectar al WebSocket para notificaciones: ' + error.message),
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
          const index = this.messages.findIndex((m) => m.id === tempMessage.id);
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
    if (message.type !== 'PROPOSAL') {
      this.toastr.error('Solo puedes responder a una propuesta');
      return;
    }
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

    if (productId && !this.userProducts.some((p) => p.id === productId)) {
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

          if (type === 'PROPOSAL_RESPONSE') {
            this.negotiationService.createTransaction(this.conversation!.id).subscribe({
              next: (transaction) => {
                this.toastr.success(`Transacción creada con ID: ${transaction.id}`);
                this.loadTransactionState(transaction.id);
              },
              error: (error) => {
                this.toastr.error('Error al crear la transacción: ' + error.message);
              },
            });
          }
        },
        error: (error) => {
          this.toastr.error(`Error al enviar ${type === 'PROPOSAL' ? 'la propuesta' : 'la respuesta'}: ${error.message}`);
        },
      });
  }

  loadTransactionsFromMessages() {
    console.log('Cargando transacciones desde mensajes...');
    console.log('Mensajes actuales:', this.messages);
    this.messages.forEach((message) => {
      if (message.isSystem && message.text.includes('Transacción creada')) {
        const transactionId = this.getTransactionId(message.text);
        console.log(`Transacción encontrada con ID: ${transactionId}`);
        if (transactionId) {
          this.loadTransactionState(transactionId);
        }
      }
    });
  }

  loadTransactionState(transactionId: number) {
    console.log(`Cargando estado de la transacción ${transactionId}...`);
    this.transactionService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        console.log(`Transacción ${transactionId} cargada:`, transaction);
        this.transactions[transactionId] = transaction;
        this.cdr.detectChanges();
        console.log('Estado actual de this.transactions:', this.transactions);
      },
      error: (error) => {
        console.error(`Error al cargar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al cargar el estado de la transacción: ' + error.message);
      },
    });
  }

  acceptTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    this.isAccepting[transactionId] = true;
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, true).subscribe({
      next: (transaction) => {
        this.transactions[transactionId] = transaction;
        this.cdr.detectChanges();
        this.toastr.success('Transacción aceptada');
        this.isAccepting[transactionId] = false;
      },
      error: (error) => {
        this.toastr.error('Error al aceptar la transacción: ' + error.message);
        this.isAccepting[transactionId] = false;
      },
    });
  }

  rejectTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    this.isRejecting[transactionId] = true;
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, false).subscribe({
      next: (transaction) => {
        this.transactions[transactionId] = transaction;
        this.cdr.detectChanges();
        this.toastr.success('Transacción rechazada');
        this.isRejecting[transactionId] = false;
      },
      error: (error) => {
        this.toastr.error('Error al rechazar la transacción: ' + error.message);
        this.isRejecting[transactionId] = false;
      },
    });
  }

  showTransactionDetails(transactionId: number) {
    const transaction = this.transactions[transactionId];
    if (!transaction) {
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const proposalMessage = this.messages.filter((m) => m.type === 'PROPOSAL').slice(-1)[0];
    const responseMessage = this.messages.filter((m) => m.type === 'PROPOSAL_RESPONSE').slice(-1)[0];

    if (!proposalMessage || !responseMessage) {
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const details = `
      Detalles de la Transacción ID: ${transactionId}
      Propuesta:
      - Producto: ${this.getProductTitle(proposalMessage.productId) || 'Ninguno'}
      - Créditos: ${proposalMessage.creditsOffered || 0}
      Respuesta:
      - Producto: ${this.getProductTitle(responseMessage.productId) || 'Ninguno'}
      - Créditos: ${responseMessage.creditsOffered || 0}
      Estado: ${transaction.status}
      Comprador ha aceptado: ${transaction.buyerAccepted ? 'Sí' : 'No'}
      Vendedor ha aceptado: ${transaction.sellerAccepted ? 'Sí' : 'No'}
    `;
    this.toastr.info(details, 'Detalles de la Transacción', { timeOut: 10000 });
  }

  hasAccepted(transactionId: number): boolean {
    const transaction = this.transactions[transactionId];
    if (!transaction || !this.currentUser) {
      console.log('Transacción o usuario no definido:', { transaction, currentUser: this.currentUser });
      return false;
    }

    const isBuyer = this.currentUser.id === transaction.buyerId;
    console.log(`Usuario ${this.currentUser.id}, es comprador: ${isBuyer}, buyerAccepted: ${transaction.buyerAccepted}, sellerAccepted: ${transaction.sellerAccepted}`);
    const hasAccepted = isBuyer ? transaction.buyerAccepted : transaction.sellerAccepted;
    console.log(`hasAccepted para transacción ${transactionId}: ${hasAccepted}`);
    return hasAccepted;
  }

  getTransactionId(messageText: string): number {
    const match = messageText.match(/ID: (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  isCurrentUser(senderId: number): boolean {
    return this.currentUser?.id === senderId;
  }

  getMessageSender(senderId: number): User | undefined {
    return this.users.find((user) => user.id === senderId);
  }

  getProductTitle(productId?: string): string {
    if (!productId) return '';
    const product = this.userProducts.find((p) => p.id === productId);
    return product ? product.title : `Producto ${productId}`;
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
    if (this.wsNotificationSubscription) this.wsNotificationSubscription.unsubscribe();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
  }

  consoleLog(transaction: Transaction): boolean {
    console.log('Transacción en la plantilla:', transaction);
    return true;
  }
}