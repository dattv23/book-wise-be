export interface Rating {
  userId: string
  productId: string
  rating: number
  timestamp?: Date
}

export interface RecommendationRequest {
  userId: string
  topK?: number
  excludePurchased?: boolean
}

export interface RecommendationResponse {
  userId: string
  recommendations: ProductRecommendation[]
  algorithm: string
  generatedAt: Date
}

export interface ProductRecommendation {
  productId: string
  score: number
  product?: {
    id: string
    name: string
    thumbnailUrl: string
    originalPrice: number
    discount: number
    category: {
      name: string
    }
  }
}

export interface ModelTrainingRequest {
  algorithm?: 'SVD' | 'NMF' | 'KNNBasic'
  parameters?: Record<string, unknown>
}

export type RecommendationOptions = {
  topK?: number
  excludePurchased?: boolean
}

export type PopularProductOptions = {
  categoryId?: string
  topK?: number
}
