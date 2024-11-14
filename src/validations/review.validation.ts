import z from 'zod'

import { paginationAndSortingSchema } from './custom.validation'
import { objectIdRegex } from '@/utils/regex'

const createReview = {
  body: z.object({
    bookId: z.string().uuid(),
    rating: z.coerce.number({ required_error: 'Rating is required' }).min(1).max(5),
    comment: z.string().optional()
  })
} as const

const getReviews = {
  query: z
    .object({
      // Filter fields
      bookId: z.string().uuid().optional(),
      userId: z.string().uuid().optional()
    })
    .merge(paginationAndSortingSchema)
} as const

export type TQueryReviews = z.infer<typeof getReviews.query>

const getReview = {
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, 'Invalid ID format')
  })
} as const

const updateReview = {
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, 'Invalid ID format')
  }),
  body: z
    .object({
      rating: z.coerce.number().min(1).max(5).optional(),
      comment: z.string().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      path: ['global'],
      message: 'At least one field must be provided for update'
    })
} as const

const deleteReview = {
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, 'Invalid ID format')
  })
} as const

export default {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview
}
