import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RevieweableProductDto {
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  reviewerId: number;
  reviewedUserId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserReviewService {

   private apiUrl = 'http://localhost:8091/api/reviews';

  constructor(private http: HttpClient) { }

  getProductsAvailableForReview(userId: number): Observable<RevieweableProductDto[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<RevieweableProductDto[]>(`${this.apiUrl}/available-products`, { params })
      .pipe(
        catchError((err) => {
          console.error('Error fetching reviewable products:', err);
          return throwError(() => new Error('No se pudieron obtener los productos para reseñar'));
        })
      );
  }
}