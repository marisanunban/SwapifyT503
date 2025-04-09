package com.example.cloudinary_service.controllers;

import com.example.cloudinary_service.entities.Image;
import com.example.cloudinary_service.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/cloudinary")
@CrossOrigin(origins = "http://localhost:4200")
public class CloudinaryController {

    @Autowired
    CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam MultipartFile multipartFile) throws IOException {
        BufferedImage bi = ImageIO.read(multipartFile.getInputStream());
        if (bi == null) {
            return new ResponseEntity<>(Map.of("error", "No valid image"), HttpStatus.BAD_REQUEST);
        }

        Map result = cloudinaryService.upload(multipartFile);

        return new ResponseEntity<>(
                Map.of(
                        "message", "Image uploaded successfully",
                        "imageUrl", (String) result.get("url"),
                        "publicId", (String) result.get("public_id")
                ),
                HttpStatus.OK
        );
    }

    @DeleteMapping("/delete/{publicId}")
    public ResponseEntity<String> delete(@PathVariable("publicId") String publicId) {
        try {
            cloudinaryService.delete(publicId);
            return new ResponseEntity<>("Image deleted from Cloudinary", HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>("Failed to delete image from Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
