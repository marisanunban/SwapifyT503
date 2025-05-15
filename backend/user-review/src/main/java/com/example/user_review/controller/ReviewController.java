package com.example.user_review.controller;

import com.example.user_review.DTOs.ProductReviewTargetDTO;
import com.example.user_review.DTOs.ReviewDTO;
import com.example.user_review.DTOs.TransactionDto;
import com.example.user_review.clients.TransactionClient;
import com.example.user_review.entities.Review;
import com.example.user_review.serviceImpl.ReviewService;
import jakarta.transaction.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private TransactionClient transactionClient;


    @PostMapping("/createReview")
    public ResponseEntity<?> createReview(@RequestBody ReviewDTO request) {
        Long reviewerId = request.getReviewerId();
        Long reviewedUserId = request.getReviewedUserId();
        // Verificar transacción completada entre usuarios
        if (transactionClient.checkCompletedTransaction(reviewerId, reviewedUserId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No puedes dejar una review sin haber completado una transacción con este usuario.");
        }

        // Si pasó el filtro, crear la review
        Review review = reviewService.createReviewFromDTO(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsForUser(userId));
    }

    @GetMapping("/user/{userId}/rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getAverageRatingForUser(userId));
    }

    @GetMapping("/user/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getPositiveNegativeCounts(@PathVariable Long userId) {
        long positives = reviewService.getPositiveReviewCount(userId);
        long negatives = reviewService.getNegativeReviewCount(userId);

        Map<String, Long> response = new HashMap<>();
        response.put("positives", positives);
        response.put("negatives", negatives);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reviewable-products")
    public ResponseEntity<List<ProductReviewTargetDTO>> getReviewableProducts(
            @RequestParam Long userA, // quien quiere dejar la review
            @RequestParam Long userB) {

        List<TransactionDto> completedTransactions = transactionClient.checkCompletedTransaction(userA, userB);

        List<ProductReviewTargetDTO> products = new ArrayList<>();

        for (TransactionDto t : completedTransactions) {
            // Si userA fue comprador, puede opinar sobre productRequestedId
            if (Objects.equals(t.getBuyerId(), userA)) {
                products.add(new ProductReviewTargetDTO(t.getProductRequestedId(), userB));
            }
            // Si userA fue vendedor, puede opinar sobre productOfferedId
            if (Objects.equals(t.getSellerId(), userA)) {
                products.add(new ProductReviewTargetDTO(t.getProductOfferedId(), userB));
            }
        }

        return ResponseEntity.ok(products);
    }
}
