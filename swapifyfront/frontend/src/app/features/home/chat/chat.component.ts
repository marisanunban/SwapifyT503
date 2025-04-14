import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TransactionService } from "../../../services/transaction-service/transaction.service";

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit {
  conversationId!: number;
  currentUser = { id: 1, name: "Usuario Actual", avatar: "/placeholder.svg" }; // Cambiar por datos reales
  otherUser: any = null; // Se cargará desde el backend
  messages: any[] = []; // Lista de mensajes
  newMessage: string = "";

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    // Obtén el conversationId de la URL
    this.conversationId = +this.route.snapshot.paramMap.get("id")!;
    this.loadConversation();
  }

  loadConversation(): void {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No hay token disponible.");
      return;
    }

    this.transactionService.getConversation(this.conversationId, token).subscribe({
      next: (conversation) => {
        this.messages = conversation.messages || [];
        this.otherUser = conversation.otherUser; // Carga los datos del otro usuario
      },
      error: (error) => {
        console.error("Error al cargar la conversación:", error);
      },
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim() === "") return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No hay token disponible.");
      return;
    }

    this.transactionService
      .sendMessage(this.conversationId, this.newMessage, token)
      .subscribe({
        next: (message) => {
          this.messages.push(message); // Agrega el mensaje a la lista
          this.newMessage = ""; // Limpia el campo de entrada
        },
        error: (error) => {
          console.error("Error al enviar el mensaje:", error);
        },
      });
  }
}