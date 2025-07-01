import _ from 'lodash'
import { User } from '@prisma/client'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { reviewService, sentimentService } from '@/services'
import { TQueryReviews } from '@/validations/review.validation'

const createReview = catchAsync(async (req, res) => {
  const { id: userId } = req.user as User
  const { productId, rating, comment } = req.body
  let sentiment = null
  let isValid = true
  if (comment && comment.length > 2) {
    sentiment = await sentimentService.predictCommentSentiment(comment)
    if (sentiment === 'pos' && rating <= 2) {
      isValid = false
    }
    if (sentiment === 'neg' && rating >= 4) {
      isValid = false
    }
  }
  const review = await reviewService.createReview({ userId, productId, rating, comment, sentiment, isValid })
  sendResponse.created(res, review, 'Create review successfully!')
})

const getReviews = catchAsync(async (req, res) => {
  const query: TQueryReviews = req.query
  const filter = _.pick(query, ['productId', 'userId', 'isValid', 'sentiment'])
  const options = _.pick(query, ['sortBy', 'limit', 'page', 'search'])
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
