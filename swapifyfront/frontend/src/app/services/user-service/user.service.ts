import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8082/api/users'; // URL de tu API de users

  constructor(private http: HttpClient) {}

  create(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/create`, {}, { headers });
  }

  getUserProfile(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log(headers);
    return this.http.get(`${this.apiUrl}/me`, { headers });
  }

  getUserById(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(`${this.apiUrl}/${id}`, { headers });
  }

  updateUserProfile(token: string, profileData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.patch(`${this.apiUrl}/me`, profileData, { headers });
  }
}