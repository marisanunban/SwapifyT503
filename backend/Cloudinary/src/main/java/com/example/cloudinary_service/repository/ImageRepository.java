package com.example.cloudinary_service.repository;

import com.example.cloudinary_service.entities.Image;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends MongoRepository<Image, String> {
    List<Image> findByOrderById();
}
