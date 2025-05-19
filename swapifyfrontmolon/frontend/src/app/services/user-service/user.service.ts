import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../../models/user.model'; // Importamos desde models

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8082/api/users';

  constructor(private http: HttpClient) {}

  create(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/create`, {}, { headers });
  }

  getUserProfile(token: string): Observable<UserProfile> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log(headers);
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers });
  }

  getUserById(id: number, token: string): Observable<UserProfile> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`, { headers });
  }

  updateUserProfile(token: string, profileData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch(`${this.apiUrl}/me`, profileData, { headers });
  }

  getOtherUserProfile(userEmail: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/viewOtherUser/${userEmail}`);
  }

  updateUserLocation(userId: number, payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/${userId}/location`, payload, { headers });
  }
}