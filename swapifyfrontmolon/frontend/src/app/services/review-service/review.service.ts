import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:8091/api/reviews'; // Cambia la URL según tu configuración
  constructor(private http: HttpClient) { }

 createReview(review: {
    productId: string,
    reviewerId: number,
    reviewedUserId: number,
    rating: number,
    comment: string
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, review);
  }
}
