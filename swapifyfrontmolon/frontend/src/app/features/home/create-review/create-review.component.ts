import { Component, OnInit,Output,EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review-service/review.service';


@Component({
  selector: 'app-create-review',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.css'
})

export class CreateReviewComponent implements OnInit {
 id: number = 0;
 reviewerId: number = 0;
 reviewedUserId: number = 0;
 productId: string = '';
  
  rating: number = 0;
  comment: string = '';
  @Output() reviewSubmitted = new EventEmitter<any>();
  @Output() reviewCancelled = new EventEmitter<void>();
  constructor(private router: Router, private reviewService: ReviewService) {
    
    
  }

  ngOnInit(): void {
    // Initialization logic here
  }
  setRating(value: number): void {
    this.rating = value;
  }

  isValid(): boolean {
    return this.rating > 0;
  }

  submitReview(): void {
    if (!this.isValid()) return;
    
    const review = {
      id: this.id,
      reviewerId: this.reviewerId,
      reviewedUserId: this.reviewedUserId,
      productId: this.productId,
      rating: this.rating,
      comment: this.comment,
      createdAt: new Date()
    };
    console.log('Reseña a enviar:', review);
    
    this.reviewService.createReview(review).subscribe({
      next: (response) => {
        console.log('Reseña creada con éxito:', response);
        this.router.navigate(['/profile']); // Redirigir al perfil
      },
      error: (error) => {
        console.error('Error al crear la reseña:', error);
        console.log('No se pudo crear la reseña. Verifica si tienes una transacción completada con este usuario.');
      }
    });
  }

  cancelReview(): void {
    this.reviewCancelled.emit();
    this.router.navigate(['/profile']);
  }
  // Add any methods or properties needed for the component

}
