import { PrismaClient } from '@prisma/client'
import { PythonShell } from 'python-shell'
import path from 'path'
import fs from 'fs/promises'
import { Rating, RecommendationResponse, ProductRecommendation, ModelTrainingRequest, RecommendationOptions, PopularProductOptions } from '@/types/recommendation.types'
import config from '@/configs/config'

const prisma = new PrismaClient()

const pythonScriptPath = path.join(__dirname, '../scripts')

const getRecommendations = async (userId: string, options: RecommendationOptions): Promise<ProductRecommendation[]> => {
  const { topK = 10, excludePurchased = true } = options

  try {
    const ratingsData = await getRatingsData()
    await saveRatingsToFile(ratingsData)

    const pythonOptions = {
      mode: 'json' as const,
      pythonPath: config.python.path,
      scriptPath: pythonScriptPath,
      args: ['--user_id', userId, '--top_k', topK.toString(), '--exclude_purchased', excludePurchased.toString()]
    }

    const results = await PythonShell.run('recommendation_engine.py', pythonOptions)
    const recommendationIds = results[0] as string[]

    const recommendations = await getProductDetails(recommendationIds, excludePurchased ? userId : undefined)

    return recommendations
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return getFallbackRecommendations(userId, options)
  }
}

const getSimilarProducts = async (productId: string, topK: number): Promise<ProductRecommendation[]> => {
  try {
    const pythonOptions = {
      mode: 'json' as const,
      pythonPath: config.python.path,
      scriptPath: pythonScriptPath,
      args: ['--mode', 'similar', '--product_id', productId, '--top_k', topK.toString()]
    }

    const results = await PythonShell.run('recommendation_engine.py', pythonOptions)
    const similarProductIds = results[0] as string[]

    return getProductDetails(similarProductIds)
  } catch (error) {
    console.error('Error getting similar products:', error)
    return []
  }
}

const trainModel = async (data: ModelTrainingRequest): Promise<any> => {
  const { algorithm = 'SVD', parameters = {} } = data

  try {
    const ratingsData = await getRatingsData()
    await saveRatingsToFile(ratingsData)

    const pythonOptions = {
      mode: 'text' as const,
      pythonPath: config.python.path,
      scriptPath: pythonScriptPath,
      args: ['--mode', 'train', '--algorithm', algorithm, '--parameters', JSON.stringify(parameters)],
      stderr: true
    }

    const results = await PythonShell.run('recommendation_engine.py', pythonOptions)
    const output = results[0]

    if (output.error) {
      throw new Error(`Python error: ${output.error}`)
    }
    return output
  } catch (error) {
    console.error('Error training model:', error)
    throw error
  }
}

const getPopularProducts = async (options: PopularProductOptions): Promise<ProductRecommendation[]> => {
  const { categoryId, topK = 10 } = options

  const whereClause: any = {
    isDeleted: false,
    stockQuantity: { gt: 0 }
  }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } },
      reviews: { select: { rating: true } },
      orderItems: { select: { quantity: true } }
    },
    take: topK * 2
  })

  const popularProducts = products
    .map((product) => {
      const totalSales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const avgRating = product.reviews.length > 0 ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 0

      const popularityScore = totalSales * 0.7 + avgRating * 0.3

      return {
        productId: product.id,
        score: popularityScore,
        product: {
          id: product.id,
          name: product.name,
          thumbnailUrl: product.thumbnailUrl,
          originalPrice: product.originalPrice,
          discount: product.discount,
          category: { name: product.category.name }
        }
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return popularProducts
}

const addRating = async (rating: Rating): Promise<void> => {
  await prisma.review.create({
    data: {
      userId: rating.userId,
      productId: rating.productId,
      rating: rating.rating,
      comment: null
    }
  })
}

const getPersonalizedRecommendations = async (userId: string, options: RecommendationOptions): Promise<ProductRecommendation[]> => {
  const userReviews = await prisma.review.count({
    where: { userId, isDeleted: false }
  })

  // Nếu user chưa có đủ reviews, trả về popular products
  if (userReviews < 3) {
    const popularProducts = await getPopularProducts({ topK: options.topK ?? 10 })
    return popularProducts
  }

  // Nếu có đủ data, dùng collaborative filtering
  return getRecommendations(userId, options)
}

// Helper functions
const getRatingsData = async (): Promise<Rating[]> => {
  const reviews = await prisma.review.findMany({
    where: { isDeleted: false },
    select: {
      userId: true,
      productId: true,
      rating: true,
      createdAt: true
    }
  })

  return reviews.map((review) => ({
    userId: review.userId,
    productId: review.productId,
    rating: review.rating,
    timestamp: review.createdAt
  }))
}

const saveRatingsToFile = async (ratings: Rating[]): Promise<void> => {
  const csvContent = ratings.map((r) => `${r.userId},${r.productId},${r.rating}`).join('\n')

  const header = 'user_id,product_id,rating\n'
  await fs.writeFile(path.join(pythonScriptPath, 'ratings.csv'), header + csvContent)
}

const getProductDetails = async (productIds: string[], excludeUserId?: string): Promise<ProductRecommendation[]> => {
  const whereClause: any = {
    id: { in: productIds },
    isDeleted: false,
    stockQuantity: { gt: 0 }
  }

  // Exclude products user already purchased
  if (excludeUserId) {
    const purchasedProducts = await prisma.orderItem.findMany({
      where: {
        order: { userId: excludeUserId }
      },
      select: { productId: true }
    })

    const purchasedProductIds = purchasedProducts.map((item) => item.productId)
    whereClause.id = {
      in: productIds,
      notIn: purchasedProductIds
    }
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } }
    }
  })

  return productIds
    .map((id) => {
      const product = products.find((p) => p.id === id)
      if (!product) return null

      return {
        productId: product.id,
        score: 1.0,
        product: {
          id: product.id,
          name: product.name,
          thumbnailUrl: product.thumbnailUrl,
          originalPrice: product.originalPrice,
          discount: product.discount,
          category: { name: product.category.name }
        }
      }
    })
    .filter(Boolean) as ProductRecommendation[]
}

const getFallbackRecommendations = async (userId: string, options: RecommendationOptions): Promise<ProductRecommendation[]> => {
  const popularProducts = await getPopularProducts({ topK: options.topK })

  return popularProducts
}

export default {
  getRecommendations,
  getSimilarProducts,
  trainModel,
  getPopularProducts,
  addRating,
  getPersonalizedRecommendations
}
