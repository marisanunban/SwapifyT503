// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth';
  // Ajustamos el tipo para que coincida con los datos de /api/users/create
  private userSubject = new BehaviorSubject<{ id: number; username: string; credits: number } | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  register(registerData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerData);
  }

  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginData);
  }

  // Nuevo método para actualizar el usuario después de /api/users/create
  updateUser(userData: { id: number; username: string; credits: number }) {
    this.userSubject.next(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  private loadUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }
}