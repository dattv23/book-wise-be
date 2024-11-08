import httpStatus from 'http-status-codes'
import { Review, Prisma } from '@prisma/client'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a review
 * @param {Object} reviewBody
 * @returns {Promise<Review>}
 */
const createReview = async (data: Pick<Review, 'rating' | 'comment' | 'userId' | 'bookId'>): Promise<Review> => {
  const { rating, comment, userId, bookId } = data

  // Check if the user has already reviewed this book
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      bookId
    }
  })

  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User has already reviewed this book')
  }

  return prisma.review.create({
    data: {
      rating,
      comment,
      userId,
      bookId
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
  filter: object,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  }
): Promise<Review[]> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const reviews = await prisma.review.findMany({
    where: { ...filter, isDeleted: false },
    include: {
      book: {
        select: {
          id: true,
          info: true
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
  })
  return reviews as Review[]
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
      book: {
        select: {
          id: true,
          info: true
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
  keys: Key[] = ['id', 'bookId', 'userId', 'rating', 'comment', 'createdAt', 'updatedAt'] as Key[]
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
