import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth'; // Ajusta el puerto si es necesario
  private userSubject = new BehaviorSubject<{ email: string; credits: number } | null>(null);
  public user$ = this.userSubject.asObservable(); // Observable para acceder al usuario

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  register(registerData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerData);
  }

  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post<{ email: string; credits: number }>(`${this.apiUrl}/login`, loginData).pipe(
      tap(userData => {
        this.userSubject.next(userData); // Actualizar el estado del usuario
        localStorage.setItem('user', JSON.stringify(userData)); // Guardar en localStorage
      })
    );
  }
  logout() {
    this.userSubject.next(null); // Borrar usuario en el frontend
    localStorage.removeItem('user'); // Eliminar del almacenamiento local
  }

  private loadUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser)); // Recuperar usuario si hay sesión activa
    }
}
}