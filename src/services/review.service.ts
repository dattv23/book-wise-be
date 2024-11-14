import httpStatus from 'http-status-codes'
import { Review, Prisma } from '@prisma/client'
import csvParser from 'csv-parser'
import fs from 'fs'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a review
 * @param {Object} data
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
  filter: object, // { title: string, author: string }
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  }
): Promise<{ reviews: Review[]; totalPages: number }> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
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
    }),
    prisma.review.count({
      where: { ...filter, isDeleted: false }
    })
  ])
  return { reviews, totalPages: Math.ceil(total / limit) }
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

const importReviews = async (filePath: string): Promise<boolean> => {
  const reviews: Review[] = []
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row: Review) =>
          reviews.push({
            ...row,
            rating: +row.rating,
            comment: row.comment ?? ''
          })
        )
        .on('end', resolve)
        .on('error', reject)
    })

    await prisma.review.createMany({
      data: reviews
    })

    return true
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  createReview,
  queryReviews,
  getReviewById,
  updateReviewById,
  deleteReviewById,
  importReviews
}
