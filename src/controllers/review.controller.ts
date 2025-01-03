import _ from 'lodash'
import { User } from '@prisma/client'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { reviewService } from '@/services'
import { TQueryReviews } from '@/validations/review.validation'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createReview = catchAsync(async (req, res) => {
  const { userId } = req.user as User
  const { bookId, rating, comment } = req.body
  const review = await reviewService.createReview({ userId, bookId, rating, comment })
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

const importReviews = catchAsync(async (req, res) => {
  const file = req.file

  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No file provided')
  }

  await reviewService.importReviews(file.path)
  sendResponse.success(res, {}, 'Import reviews successfully!')
})

export default {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  importReviews
}
