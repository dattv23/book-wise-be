import { z } from 'zod'

const getRecommendations = {
  params: z.object({
    userId: z.string()
  }),
  query: z.object({
    topK: z.number().int().min(1).max(50).optional(),
    excludePurchased: z.boolean().optional()
  })
}

const getPersonalizedRecommendations = {
  query: z.object({
    topK: z.number().int().min(1).max(50).optional(),
    excludePurchased: z.boolean().optional()
  })
}

const getSimilarProducts = {
  params: z.object({
    productId: z.string()
  }),
  query: z.object({
    topK: z.number().int().min(1).max(20).optional()
  })
}

const getPopularProducts = {
  query: z.object({
    categoryId: z.string().optional(),
    topK: z.number().int().min(1).max(50).optional()
  })
}

const trainModel = {
  body: z.object({
    algorithm: z.enum(['SVD', 'NMF', 'KNNBasic']).optional(),
    parameters: z.object({}).passthrough().optional() // allows any key-value pairs
  })
}

const addRating = {
  body: z.object({
    productId: z.string(),
    rating: z.number().int().min(1).max(5)
  })
}

export type TQueryRecommendations = {
  topK?: number
  excludePurchased?: boolean
}

export type TQueryPopularProducts = {
  categoryId?: string
  topK?: number
}

export type TQuerySimilarProducts = {
  topK?: number
}

export default {
  getRecommendations,
  getPersonalizedRecommendations,
  getSimilarProducts,
  getPopularProducts,
  trainModel,
  addRating
}
