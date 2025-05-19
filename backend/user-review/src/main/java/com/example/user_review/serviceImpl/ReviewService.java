package com.example.user_review.serviceImpl;

import com.example.user_review.DTOs.ReviewDTO;
import com.example.user_review.entities.Review;
import com.example.user_review.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public Review createReview(Review review) {
        // Puedes añadir validaciones para no permitir múltiples reviews del mismo user a otro
        return reviewRepository.save(review);
    }

    public Review createReviewFromDTO(ReviewDTO request) {
        Review review = new Review();
        review.setReviewerId(request.getReviewerId());
        review.setReviewedUserId(request.getReviewedUserId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now()); // Asignas la fecha actual

        return reviewRepository.save(review);
    }


    public List<Review> getReviewsForUser(Long reviewedUserId) {
        return reviewRepository.findByReviewedUserId(reviewedUserId);
    }

    public double getAverageRatingForUser(Long reviewedUserId) {
        List<Review> reviews = reviewRepository.findByReviewedUserId(reviewedUserId);
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    public long getPositiveReviewCount(Long reviewedUserId) {
        return reviewRepository.countByReviewedUserIdAndRatingGreaterThanEqual(reviewedUserId, 4);
    }

    public long getNegativeReviewCount(Long reviewedUserId) {
        return reviewRepository.countByReviewedUserIdAndRatingLessThanEqual(reviewedUserId, 2);
    }
}