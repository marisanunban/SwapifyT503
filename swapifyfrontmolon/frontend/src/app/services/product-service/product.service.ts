import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, CreateProductDto } from '../../models/product.model'; // Importar desde el archivo compartido

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8083/products';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createProduct(productData: CreateProductDto, token: string): Observable<Product> {
    const headers = this.getAuthHeaders(token);
    return this.http.post<Product>(`${this.apiUrl}`, productData, { headers }); // Corregido: productDataweakness -> productData
  }

  getAllProducts(token?: string): Observable<Product[]> {
    const headers = token ? this.getAuthHeaders(token) : undefined;
    return this.http.get<Product[]>(`${this.apiUrl}`, { headers });
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    const params = { category };
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getProductsByOwner(ownerId: number, token: string): Observable<Product[]> {
    const headers = this.getAuthHeaders(token);
    return this.http.get<Product[]>(`${this.apiUrl}/ownerId/${ownerId}`, { headers });
  }

  deleteProduct(productId: string, token: string): Observable<void> {
    const headers = this.getAuthHeaders(token);
    return this.http.delete<void>(`${this.apiUrl}/${productId}`, { headers });
  }

  getProductById(productId: string, token: string): Observable<Product> {
    const headers = this.getAuthHeaders(token);
    return this.http.get<Product>(`${this.apiUrl}/${productId}`, { headers });
  }

  updateProduct(productId: string, productData: Partial<Product>, token: string): Observable<Product> {
    const headers = this.getAuthHeaders(token);
    return this.http.patch<Product>(`${this.apiUrl}/${productId}`, productData, { headers });
  }

  searchProducts(
    keyword: string,
    latitude?: number,
    longitude?: number,
    radiusKm: number = 10.0,
    category?: string
  ): Observable<Product[]> {
    const params: any = {
      keyword,
      radiusKm,
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(category && { category })
    };
    return this.http.get<Product[]>(`${this.apiUrl}/search`, { params });
  }

  searchProductsByCoordinates(
    latitude?: number,
    longitude?: number,
    radius: number = 10.0,
    category?: string,
    keyword?: string
  ): Observable<Product[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token disponible. Por favor, inicia sesión.');
    }

    const headers = this.getAuthHeaders(token);

    const params: any = {
      radius: radius.toString(),
      ...(latitude !== undefined && { latitude: latitude.toString() }),
      ...(longitude !== undefined && { longitude: longitude.toString() }),
      ...(category && { category }),
      ...(keyword && { keyword })
    };

    return this.http.get<Product[]>(`${this.apiUrl}/by-coordinates`, { headers, params });
  }
}