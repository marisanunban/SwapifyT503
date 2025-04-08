import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private apiUrl = 'http://localhost:8084/transactions'; // Cambia esto por la URL de tu backend

  constructor(private http: HttpClient) {}

  createTransaction(productId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = {
      productId, // Ajusta esto según la estructura de CreateTransactionDto
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}