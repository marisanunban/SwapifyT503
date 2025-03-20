import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth'; // Ajusta el puerto si es necesario

  constructor(private http: HttpClient) {}

  register(registerData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerData);
  }

  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginData);
  }
}