import httpStatus from 'http-status-codes'
import { Review, Prisma } from '@prisma/client'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a review
 * @param {Object} data
 * @returns {Promise<Review>}
 */
const createReview = async (data: Pick<Review, 'rating' | 'comment' | 'sentiment' | 'isValid' | 'userId' | 'productId'>): Promise<Review> => {
  const { rating, comment, userId, productId, sentiment, isValid } = data

  // Check if the user has already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId
    }
  })

  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User has already reviewed this product')
  }

  return prisma.review.create({
    data: {
      rating,
      comment,
      sentiment,
      isValid,
      userId,
      productId
    }
  })
}

/**
 * Query for reviews
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryReviews = async (
  filter: object, // { sentiment: string, isValid: string }
  options: {
    search?: string
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  }
): Promise<{ reviews: Review[]; total: number; average: number; totalPages: number }> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const search = options.search ?? ''

  const searchConditions =
    search.trim() !== ''
      ? {
          OR: [{ comment: { contains: search, mode: Prisma.QueryMode.insensitive } }, { productId: { equals: search } }, { userId: { equals: search } }]
        }
      : {}

  const whereClause = {
    ...filter,
    isDeleted: false,
    ...searchConditions
  }

  const [reviews, total, aggregations] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined
    }),
    prisma.review.count({
      where: whereClause
    }),
    prisma.review.aggregate({
      where: whereClause,
      _avg: {
        rating: true
      }
    })
  ])
  return { reviews, total, average: Math.round((aggregations._avg.rating ?? 0) * 100) / 100, totalPages: Math.ceil(total / limit) }
}

/**
 * Get review by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Review | null>}
 */
const getReviewById = async (id: string): Promise<Review | null> => {
  const review = (await prisma.review.findUnique({
    where: { id, isDeleted: false },
    include: {
      product: {
        select: {
          id: true,
          name: true
        }
      },
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })) as Review | null

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found')
  }

  return review
}

/**
 * Update review by id
 * @param {ObjectId} reviewId
 * @param {Object} updateBody
 * @returns {Promise<Review>}
 */
const updateReviewById = async <Key extends keyof Review>(
  reviewId: string,
  updateBody: Prisma.ReviewUpdateInput,
  keys: Key[] = ['id', 'productId', 'userId', 'rating', 'comment', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Review, Key> | null> => {
  const review = await getReviewById(reviewId)
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found')
  }
  const updatedReview = await prisma.review.update({
    where: { id: review.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedReview as Pick<Review, Key> | null
}

/**
 * Delete review by id
 * @param {ObjectId} reviewId
 * @returns {Promise<Review>}
 */
const deleteReviewById = async (reviewId: string): Promise<Review> => {
  const review = await getReviewById(reviewId)
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found')
  }
  await prisma.review.update({
    where: { id: review.id },
    data: {
      isDeleted: true
    }
  })
  return review
}

export default {
  createReview,
  queryReviews,
  getReviewById,
  updateReviewById,
  deleteReviewById
}
