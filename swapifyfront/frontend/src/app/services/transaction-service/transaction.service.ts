import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8084/transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  createTransaction(productId: string, creditsOffered: number): Observable<any> {
    const body = {
      productOfferedId: productId,
      creditsOffered
    };
    return this.http
      .post(this.apiUrl, body, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error creating transaction:', err);
          return throwError(() => new Error('No se pudo crear la transacción'));
        })
      );
  }

  updateTransactionStatus(transactionId: number, status: 'ACCEPTED' | 'REJECTED', productRequestedId?: string): Observable<any> {
    const body = {
      status,
      productRequestedId: productRequestedId || null
    };
    return this.http
      .put(`${this.apiUrl}/${transactionId}/status`, body, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error updating transaction status:', err);
          return throwError(() => new Error('No se pudo actualizar el estado de la transacción'));
        })
      );
  }

  getTransaction(transactionId: number): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/${transactionId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error fetching transaction:', err);
          return throwError(() => new Error('No se pudo obtener la transacción'));
        })
      );
  }
}