import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8083/products'; // URL de tu API de productos

  constructor(private http: HttpClient) {}

  createProduct(productData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}`, productData, { headers });
  }
  getAllProducts(token?: string): Observable<any> {
    const headers = token
      ? new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      : undefined;
  
    return this.http.get(`${this.apiUrl}`, { headers });
  }

  getProductsByOwner(ownerId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.apiUrl}/owner/${ownerId}`, { headers });
  }

  deleteProduct(productId: string, token: string): Observable<void> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.delete<void>(`${this.apiUrl}/${productId}`, { headers });
  }

  getProductById(productId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.get(`${this.apiUrl}/${productId}`, { headers });
  }

  updateProduct(productId: string, productData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.patch(`${this.apiUrl}/${productId}`, productData, { headers });
  }
}