export interface Conversation {
  id: number;
  productId: string;
  buyerId: number;
  sellerId: number;
  messages: any[];
  status: string;
  proposalProductIds?: string;
  proposalCreditsOffered?: number;
  createdAt: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string[];
  ownerId: number;
  category?: string;
  imageId?: string[];
  conversation?: Conversation; // Usar el tipo completo Conversation
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