import _ from 'lodash'
import { User } from '@prisma/client'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { reviewService } from '@/services'
import { TQueryReviews } from '@/validations/review.validation'

const createReview = catchAsync(async (req, res) => {
  const { id } = req.user as User
  const { bookId, rating, comment } = req.body
  const review = await reviewService.createReview({ userId: id, bookId, rating, comment })
  sendResponse.created(res, review, 'Create review successfully!')
})

const getReviews = catchAsync(async (req, res) => {
  const query: TQueryReviews = req.query
  const filter = _.pick(query, ['bookId', 'userId'])
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await reviewService.queryReviews(filter, options)
  sendResponse.success(res, result, 'Get reviews successfully!')
})

const getReview = catchAsync(async (req, res) => {
  const review = await reviewService.getReviewById(req.params.reviewId)
  sendResponse.success(res, review, 'Get review successfully!')
})

const updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReviewById(req.params.reviewId, req.body)
  sendResponse.success(res, review, 'Update review successfully!')
})

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReviewById(req.params.reviewId)
  sendResponse.noContent(res, {}, 'Delete review successfully!')
})

export default {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview
}
