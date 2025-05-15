export interface Product {
  id: number;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string[];
  ownerId: number;
  category?: string;
  imageId?: string[];
  conversation?: { id: number };
}

export interface CreateProductDto {
  title: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string[];
  imageId: string[];
  ownerId: number;
}