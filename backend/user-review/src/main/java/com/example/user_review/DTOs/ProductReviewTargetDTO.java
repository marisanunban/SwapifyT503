package com.example.user_review.DTOs;

public class ProductReviewTargetDTO {
    private String productId;
    private Long reviewedUserId;

    public ProductReviewTargetDTO(String productId, Long reviewedUserId) {
        this.productId = productId;
        this.reviewedUserId = reviewedUserId;
    }
    public ProductReviewTargetDTO(){}

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Long getReviewedUserId() {
        return reviewedUserId;
    }

    public void setReviewedUserId(Long reviewedUserId) {
        this.reviewedUserId = reviewedUserId;
    }
}
