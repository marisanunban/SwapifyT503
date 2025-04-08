package com.example.cloudinary_service.services;

import com.example.cloudinary_service.entities.Image;
import com.example.cloudinary_service.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ImageService {

    @Autowired
    ImageRepository repository;

    public List<Image> list(){return repository.findByOrderById();}

    public Optional<Image> getOne(String id){return repository.findById(id);}

    public void save(Image image){repository.save(image);}

    public void delete(String id){repository.deleteById(id);}

    public boolean existsById(String id){return repository.existsById(id);}
}
