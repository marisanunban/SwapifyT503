    package com.example.demo.services;

    import com.example.demo.clients.AuthClient;
    import com.example.demo.dtos.CreateProductDto;
    import com.example.demo.dtos.ProductDto;
    import com.example.demo.dtos.UpdateProductDto;
    import com.example.demo.entities.Product;
    import com.example.demo.interfaces.ProductService;
    import com.example.demo.repositories.ProductRepository;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;

    import java.util.List;
    import java.util.NoSuchElementException; // Reemplazo de EntityNotFoundException
    import java.util.stream.Collectors;

    @Service
    public class ProductServiceImpl implements ProductService {

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private AuthClient authClient;

        @Override
        public ProductDto createProduct(CreateProductDto dto, Long ownerId) {
            Product product = new Product();
            product.setOwnerId(ownerId);
            product.setTitle(dto.getTitle());
            product.setDescription(dto.getDescription());
            product.setImageId(dto.getImageId());
            product.setCategory(dto.getCategory());
            product.setAttributes(dto.getAttributes());
            product.setPrice(dto.getPrice());
            product.setImageUrl(dto.getImageUrl());

            product = productRepository.save(product);
            return mapToDto(product);
        }

        @Override
        public List<ProductDto> getAllProducts(String category, String keyword) {
            List<Product> products;
            if (category != null && keyword != null) {
                products = productRepository.findByCategory(category).stream()
                        .filter(p -> p.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                        .collect(Collectors.toList());
            } else if (category != null) {
                products = productRepository.findByCategory(category);
            } else if (keyword != null) {
                products = productRepository.findByKeyword(keyword);
            } else {
                products = productRepository.findAll();
            }
            return products.stream().map(this::mapToDto).collect(Collectors.toList());
        }

        @Override
        public ProductDto getProductById(String id) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));
            return mapToDto(product);
        }

        @Override
        public ProductDto updateProduct(String id, UpdateProductDto dto, Long ownerId) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

            if (!product.getOwnerId().equals(ownerId)) {
                throw new IllegalArgumentException("You are not authorized to update this product");
            }

            if (dto.getTitle() != null) product.setTitle(dto.getTitle());
            if (dto.getDescription() != null) product.setDescription(dto.getDescription());
            if (dto.getAttributes() != null) product.setAttributes(dto.getAttributes());
            if (dto.getPrice() != null) product.setPrice(dto.getPrice());
            if (dto.getImageUrl() != null) product.setImageUrl(dto.getImageUrl());
            if(dto.getImageId() != null) product.setImageId(dto.getImageId());

            product = productRepository.save(product);
            return mapToDto(product);
        }

        @Override
        public void deleteProduct(String id, Long ownerId) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

            if (!product.getOwnerId().equals(ownerId)) {
                throw new IllegalArgumentException("You are not authorized to delete this product");
            }

            productRepository.delete(product);
        }
        @Override
        public void transferProduct(String id, Long fromUserId, Long toUserId) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

            if (!product.getOwnerId().equals(fromUserId)) {
                throw new IllegalArgumentException("The product does not belong to the specified fromUserId");
            }

            product.setOwnerId(toUserId);
            productRepository.save(product);
        }
        @Override
        public ProductDto getProductsByOwnerAndId(long ownerId, String productId) {
            Product product = productRepository.findByOwnerIdAndId(ownerId, productId);
            if (product != null){
                return mapToDto(product);
            }
            return null;
        }
        @Override
        public List<ProductDto> findByOwnerId(long ownerId){
            List<Product> products = productRepository.findByOwnerId(ownerId);

            return products.stream()
                    .map(this::mapToDto)
                    .toList();
        }

        public ProductDto mapToDto(Product product) {
            ProductDto dto = new ProductDto();
            dto.setId(product.getId());
            dto.setOwnerId(product.getOwnerId());
            dto.setTitle(product.getTitle());
            dto.setImageUrl(product.getImageUrl());
            dto.setImageId(product.getImageId());
            dto.setDescription(product.getDescription());
            dto.setCategory(product.getCategory());
            dto.setStatus(product.getStatus());
            dto.setAttributes(product.getAttributes());
            dto.setPrice(product.getPrice());
            dto.setCreatedAt(product.getCreatedAt());
            return dto;
        }
    }