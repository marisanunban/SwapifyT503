import { Component, OnInit,Output,EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserReviewService } from '../../../services/user-review-service/user-review.service';
import { ReviewService } from '../../../services/review-service/review.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { RevieweableProductDto } from '../../../services/user-review-service/user-review.service';
   // Importar la interfaz Review

@Component({
  selector: 'app-create-review',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.css'
})

export class CreateReviewComponent implements OnInit {
product: RevieweableProductDto | null = null;
  
  rating: number = 0;
  comment: string = '';
  @Output() reviewSubmitted = new EventEmitter<any>();
  @Output() reviewCancelled = new EventEmitter<void>();
  constructor(private router: Router, private reviewService: ReviewService, private route: ActivatedRoute , private userReviewService: UserReviewService, private authService: AuthService) {
    // Constructor logic here
    
    
  }

  ngOnInit() {
console.log('Iniciando CreateReviewComponent');
  }
  setRating(value: number): void {
    this.rating = value;
  }

  isValid(): boolean {
    return this.rating > 0;
  }

  submitReview(): void {
console.log(this.product);
  if (!this.isValid() || !this.product) return;

  // Construye el objeto review con los datos necesarios
  const review = {
    productId: this.product.productId,
    reviewerId: this.product.reviewerId,
    reviewedUserId: this.product.reviewedUserId,
    rating: this.rating,
    comment: this.comment
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
