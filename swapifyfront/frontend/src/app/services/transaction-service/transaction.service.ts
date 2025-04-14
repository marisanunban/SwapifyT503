import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class TransactionService {
  private apiUrl = "http://localhost:8085/api/negotiations";
  private apiUrl2 = "http://localhost:8083/transactions"; // URL de tu API de transacciones

  constructor(private http: HttpClient) {}

  startNegotiation(product_Id: string, token: string): Observable<any> {
    const headers = new HttpHeaders().set("Authorization", token);
    return this.http.post(`${this.apiUrl}/start?productId=${product_Id}`, {}, { headers });
  }

  getConversation(conversation_Id: number, token: string): Observable<any> {
    const headers = new HttpHeaders().set("Authorization", token);
    return this.http.get(`${this.apiUrl}/${conversation_Id}`, { headers });
  }

  sendMessage(conversation_Id: number, content: string, token: string): Observable<any> {
    const headers = new HttpHeaders().set("Authorization", token);
    return this.http.post(
      `${this.apiUrl}/${conversation_Id}/messages?content=${content}`,
      {},
      { headers }
    );
  }

  createTransaction(product_Id: string, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = { product_Id }; // Enviar el ID del producto en el cuerpo de la solicitud
    return this.http.post(`${this.apiUrl2}/create`, body, { headers });
  }
}