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
  private wsNotificationSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private isWebSocketConnected = false;
  private subscribedConversationId: number | null = null;

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
        console.log('[loadUserProducts] Productos cargados:', this.userProducts);
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Error al cargar la conversación');
        this.router.navigate(['/main']);
      },
    });
  }

  subscribeToMessages(conversationId: number) {
    if (this.subscribedConversationId === conversationId) {
      console.log(`[WebSocket] Ya está suscrito al canal /topic/conversations/${conversationId}, evitando suscripción duplicada`);
      return;
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      console.log(`[WebSocket] Suscripción anterior al canal /topic/conversations/${this.subscribedConversationId} cancelada`);
    }

    this.subscribedConversationId = conversationId;

    if (!this.isWebSocketConnected) {
      console.log('[WebSocket] Intentando conectar al WebSocket...');
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            console.log(`[WebSocket] Conectado al WebSocket`);
            this.subscribeToConversation(conversationId);
          } else {
            console.error('[WebSocket] No se pudo conectar al WebSocket');
            this.toastr.error('No se pudo conectar al WebSocket');
          }
        },
        error: (error) => {
          console.error('[WebSocket] Error al conectar:', error);
          this.toastr.error('Error al conectar al WebSocket: ' + error.message);
        },
      });
    } else {
      console.log('[WebSocket] WebSocket ya está conectado, procediendo a suscribir...');
      this.subscribeToConversation(conversationId);
    }
  }

  private subscribeToConversation(conversationId: number) {
    console.log(`[WebSocket] Suscribiendo al canal /topic/conversations/${conversationId}`);
    this.wsSubscription = this.websocketService
      .subscribeToConversation(conversationId)
      .subscribe({
        next: (message: any) => {
          console.log(`[WebSocket] Mensaje recibido en /topic/conversations/${conversationId}:`, message);
          if (!message) {
            console.error('[WebSocket] Mensaje recibido es undefined o null');
            return;
          }
          const content = message.content || 'Mensaje sin contenido';
          const newMessage = {
            id: message.id || Date.now(),
            conversationId: message.conversationId || conversationId,
            senderId: message.senderId || 0,
            text: content,
            time: message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
            type: message.type || 'TEXT',
            productId: message.productId || undefined,
            creditsOffered: message.creditsOffered || 0,
            isSystem: message.type === 'SYSTEM',
          };

          const messageExists = this.messages.some(
            (msg) =>
              msg.id === newMessage.id ||
              (msg.senderId === newMessage.senderId &&
               msg.text === newMessage.text &&
               msg.time === newMessage.time &&
               msg.type === newMessage.type)
          );

          if (!messageExists) {
            if (newMessage.isSystem) {
              newMessage.text = this.cleanSystemMessage(newMessage.text);
            }
            this.messages.push(newMessage);
            this.messages = [...this.messages];
            console.log('[WebSocket] Mensaje añadido a this.messages:', newMessage);
          } else {
            console.log('[WebSocket] Mensaje duplicado detectado y omitido:', newMessage);
          }

          if (message.type === 'SYSTEM') {
            const transactionId = this.getTransactionId(content);
            console.log(`[WebSocket] TransactionId extraído del mensaje de sistema: ${transactionId}`);
            if (transactionId) {
              console.log(`[WebSocket] Llamando a loadTransactionState para transactionId: ${transactionId}`);
              this.loadTransactionState(transactionId);
            } else {
              console.warn('[WebSocket] No se pudo extraer el transactionId del mensaje:', content);
            }
            this.loadTransactionsFromMessages();
          }
          this.scrollToBottom();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[WebSocket] Error en la suscripción:', error);
          this.toastr.error('Error en la conexión WebSocket: ' + error.message);
          this.isWebSocketConnected = false;
          this.subscribedConversationId = null;
          this.subscribeToMessages(conversationId);
        },
      });
  }

  private cleanSystemMessage(text: string): string {
    const sentences = text.split('. ').filter((sentence, index, self) => 
      sentence && self.indexOf(sentence) === index
    );
    return sentences.join('. ') + (sentences.length > 0 ? '.' : '');
  }

  subscribeToUserNotifications(userId: number) {
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      console.log(`[WebSocket] Suscripción anterior a notificaciones del usuario ${userId} cancelada`);
    }

    if (!this.isWebSocketConnected) {
      console.log('[WebSocket] Intentando conectar al WebSocket para notificaciones...');
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            console.log(`[WebSocket] Conectado al WebSocket para notificaciones`);
            this.subscribeToNotifications(userId);
          } else {
            this.toastr.error('No se pudo conectar al WebSocket para notificaciones');
          }
        },
        error: (error) => {
          this.toastr.error('Error al conectar al WebSocket para notificaciones: ' + error.message);
        },
      });
    } else {
      console.log('[WebSocket] WebSocket ya está conectado, procediendo a suscribir a notificaciones...');
      this.subscribeToNotifications(userId);
    }
  }

  private subscribeToNotifications(userId: number) {
    console.log(`[WebSocket] Suscribiendo a notificaciones del usuario ${userId}`);
    this.wsNotificationSubscription = this.websocketService
      .subscribeToUserNotifications(userId)
      .subscribe({
        next: (notification: any) => {
          console.log('[WebSocket] Notificación recibida para el usuario:', notification);
          const transactionId = notification.transactionId;
          const newStatus = notification.status;

          if (transactionId) {
            console.log(`[WebSocket] Notificación - Llamando a loadTransactionState para transactionId: ${transactionId}`);
            this.loadTransactionState(transactionId);
            this.toastr.info(`La transacción ${transactionId} ha cambiado a estado: ${newStatus}`);
            this.cdr.detectChanges();
          }
        },
        error: (error) => this.toastr.error('Error al recibir notificaciones WebSocket: ' + error.message),
      });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation || !this.currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const tempId = -Date.now();
    const tempMessage: Message = {
      id: tempId,
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
          const index = this.messages.findIndex((m) => m.id === tempId);
          if (index !== -1) {
            const updatedMessage = {
              ...tempMessage,
              id: response.id,
              time: new Date(response.timestamp).toLocaleTimeString(),
            };
            this.messages[index] = updatedMessage;
            this.messages = [...this.messages];
            console.log('[sendMessage] Mensaje actualizado con ID del backend:', updatedMessage);
          } else {
            console.warn('[sendMessage] No se encontró el mensaje temporal para actualizar:', tempId);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.messages = this.messages.filter((msg) => msg.id !== tempId);
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
          const newMessage = {
            id: message.id,
            conversationId: this.conversation!.id,
            senderId: this.currentUser!.id,
            text: message.content,
            time: new Date(message.timestamp).toLocaleTimeString(),
            type: message.type,
            productId: message.productId,
            creditsOffered: message.creditsOffered,
            isSystem: message.type === 'SYSTEM',
          };

          const messageExists = this.messages.some(
            (msg) =>
              msg.id === newMessage.id ||
              (msg.senderId === newMessage.senderId &&
               msg.text === newMessage.text &&
               msg.time === newMessage.time &&
               msg.type === newMessage.type)
          );

          if (!messageExists) {
            if (newMessage.isSystem) {
              newMessage.text = this.cleanSystemMessage(newMessage.text);
            }
            this.messages.push(newMessage);
            this.messages = [...this.messages];
            console.log('[submitProposal] Mensaje añadido:', newMessage);
          } else {
            console.log('[submitProposal] Mensaje duplicado detectado y omitido:', newMessage);
          }

          this.showProposalForm = false;
          this.showResponseForm = false;
          this.respondingToMessage = null;
          this.proposalForm.reset();
          this.scrollToBottom();
          this.toastr.success(type === 'PROPOSAL' ? 'Propuesta enviada' : 'Respuesta enviada');
          this.cdr.detectChanges();

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
    console.log('[loadTransactionsFromMessages] Cargando transacciones desde mensajes...');
    console.log('[loadTransactionsFromMessages] Mensajes actuales:', this.messages);
    this.messages.forEach((message) => {
      if (message.isSystem) {
        const transactionId = this.getTransactionId(message.text);
        console.log(`[loadTransactionsFromMessages] Transacción encontrada con ID: ${transactionId}`);
        if (transactionId) {
          console.log(`[loadTransactionsFromMessages] Llamando a loadTransactionState para transactionId: ${transactionId}`);
          this.loadTransactionState(transactionId);
        }
      }
    });
  }

  loadTransactionState(transactionId: number) {
    console.log(`[loadTransactionState] Cargando estado de la transacción ${transactionId}...`);
    this.transactionService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        console.log(`[loadTransactionState] Transacción ${transactionId} cargada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };

        // Si la transacción está completada, actualizamos la lista de productos
        if (transaction.status === 'COMPLETED') {
          console.log(`[loadTransactionState] Transacción ${transactionId} completada, actualizando lista de productos...`);
          
          // Identificar los productos involucrados en la transacción
          const proposalMessage = this.messages.find((m) => m.type === 'PROPOSAL' && this.getTransactionId(m.text) === transactionId);
          const responseMessage = this.messages.find((m) => m.type === 'PROPOSAL_RESPONSE' && this.getTransactionId(m.text) === transactionId);

          const tradedProductIds: (string | undefined)[] = [];
          if (proposalMessage?.productId) {
            tradedProductIds.push(proposalMessage.productId);
          }
          if (responseMessage?.productId) {
            tradedProductIds.push(responseMessage.productId);
          }
          console.log('[loadTransactionState] Productos involucrados en la transacción:', tradedProductIds);

          // Filtrar los productos intercambiados de userProducts inmediatamente
          this.userProducts = this.userProducts.filter((product) => !tradedProductIds.includes(product.id));
          console.log('[loadTransactionState] Productos filtrados de userProducts:', this.userProducts);

          // Volver a cargar la lista de productos desde el backend para asegurarnos de que está actualizada
          this.loadUserProducts();
        }

        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('[loadTransactionState] Detección de cambios forzada con setTimeout');
          console.log(`[loadTransactionState] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
          console.log(`[loadTransactionState] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
        }, 0);
        console.log('[loadTransactionState] Estado actual de this.transactions:', this.transactions);
      },
      error: (error) => {
        console.error(`[loadTransactionState] Error al cargar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al cargar el estado de la transacción: ' + error.message);
      },
    });
  }

  acceptTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    console.log(`[acceptTransaction] Aceptando transacción ${transactionId}...`);
    this.isAccepting[transactionId] = true;
    this.cdr.detectChanges();
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, true).subscribe({
      next: (transaction) => {
        console.log(`[acceptTransaction] Transacción ${transactionId} aceptada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        this.cdr.detectChanges();
        this.toastr.success('Transacción aceptada');
        this.isAccepting[transactionId] = false;
        console.log('[acceptTransaction] Evaluando condición para mostrar botones después de aceptar...');
        console.log(`[acceptTransaction] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
        console.log(`[acceptTransaction] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
      },
      error: (error) => {
        console.error(`[acceptTransaction] Error al aceptar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al aceptar la transacción: ' + error.message);
        this.isAccepting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  rejectTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    console.log(`[rejectTransaction] Rechazando transacción ${transactionId}...`);
    this.isRejecting[transactionId] = true;
    this.cdr.detectChanges();
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, false).subscribe({
      next: (transaction) => {
        console.log(`[rejectTransaction] Transacción ${transactionId} rechazada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        this.cdr.detectChanges();
        this.toastr.success('Transacción rechazada');
        this.isRejecting[transactionId] = false;
        console.log('[rejectTransaction] Evaluando condición para mostrar botones después de rechazar...');
        console.log(`[rejectTransaction] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
        console.log(`[rejectTransaction] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
      },
      error: (error) => {
        console.error(`[rejectTransaction] Error al rechazar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al rechazar la transacción: ' + error.message);
        this.isRejecting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  showTransactionDetails(transactionId: number) {
    console.log(`[showTransactionDetails] Mostrando detalles de la transacción ${transactionId}`);
    const transaction = this.transactions[transactionId];
    if (!transaction) {
      console.warn('[showTransactionDetails] No se encontraron detalles de la transacción');
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const proposalMessage = this.messages.filter((m) => m.type === 'PROPOSAL').slice(-1)[0];
    const responseMessage = this.messages.filter((m) => m.type === 'PROPOSAL_RESPONSE').slice(-1)[0];

    if (!proposalMessage || !responseMessage) {
      console.warn('[showTransactionDetails] No se encontraron mensajes de propuesta o respuesta');
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
    console.log('[showTransactionDetails] Detalles mostrados:', details);
    this.toastr.info(details, 'Detalles de la Transacción', { timeOut: 10000 });
  }

  hasAccepted(transactionId: number): boolean {
    const transaction = this.transactions[transactionId];
    if (!transaction || !this.currentUser) {
      console.log('[hasAccepted] Transacción o usuario no definido:', { transaction, currentUser: this.currentUser });
      return false;
    }

    const isBuyer = this.currentUser.id === transaction.buyerId;
    const hasAccepted = isBuyer ? transaction.buyerAccepted : transaction.sellerAccepted;
    console.log(`[hasAccepted] Usuario ${this.currentUser.id}, es comprador: ${isBuyer}, buyerAccepted: ${transaction.buyerAccepted}, sellerAccepted: ${transaction.sellerAccepted}, resultado: ${hasAccepted}`);
    return hasAccepted;
  }

  getTransactionId(messageText: string): number {
    console.log(`[getTransactionId] Procesando mensaje: "${messageText}"`);
    if (!messageText || typeof messageText !== 'string') {
      console.warn('[getTransactionId] messageText es undefined, null o no es un string:', messageText);
      return 0;
    }
    let match = messageText.match(/ID: (\d+)/);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (ID:): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/transacción (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (transacción): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/Transaccion (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (Transaccion sin tilde): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/Transacción ID: (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (Transacción ID:): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    console.warn('[getTransactionId] No se encontró transactionId en el mensaje');
    return 0;
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
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      console.log('[ngOnDestroy] Suscripción al canal WebSocket cancelada');
    }
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      console.log('[ngOnDestroy] Suscripción a notificaciones WebSocket cancelada');
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('[ngOnDestroy] Suscripción al router cancelada');
    }
    this.isWebSocketConnected = false;
    this.subscribedConversationId = null;
  }

  consoleLog(transaction: Transaction): boolean {
    console.log('[HTML] Transacción renderizada:', transaction);
    const shouldShowButtons = transaction.status === 'PENDING' && !this.hasAccepted(transaction.id);
    console.log('[HTML] Condición para mostrar botones:', shouldShowButtons);
    console.log('[HTML] transaction.status:', transaction.status);
    console.log('[HTML] hasAccepted:', this.hasAccepted(transaction.id));
    return true;
  }
}