import _ from 'lodash'
import { User } from '@prisma/client'

import catchAsync from '@/utils/catchAsync'
import sendResponse from '@configs/response'
import recommendationService from '@/services/recommendation.service'
import { TQueryRecommendations } from '@/validations/recommendation.validation'
import { PopularProductOptions } from '@/types/recommendation.types'

const getRecommendations = catchAsync(async (req, res) => {
  const { userId } = req.params
  const query: TQueryRecommendations = req.query
  const options = _.pick(query, ['topK', 'excludePurchased'])

  const result = await recommendationService.getRecommendations(userId, options)
  sendResponse.success(res, result, 'Get recommendations successfully!')
})

const getSimilarProducts = catchAsync(async (req, res) => {
  const { productId } = req.params
  const { topK = 5 } = req.query

  const result = await recommendationService.getSimilarProducts(productId, Number(topK))
  sendResponse.success(res, result, 'Get similar products successfully!')
})

const trainModel = catchAsync(async (req, res) => {
  const data = req.body
  const result = await recommendationService.trainModel(data)
  sendResponse.success(res, result, 'Model training completed successfully!')
})

const getPopularProducts = catchAsync(async (req, res) => {
  const query = req.query
  const options = _.pick(query, ['categoryId', 'topK']) as PopularProductOptions

  const result = await recommendationService.getPopularProducts(options)
  sendResponse.success(res, result, 'Get popular products successfully!')
})

const addRating = catchAsync(async (req, res) => {
  const user = req.user as User
  const data = req.body

  await recommendationService.addRating({ ...data, userId: user.id })
  sendResponse.success(res, null, 'Rating added successfully!')
})

const getPersonalizedRecommendations = catchAsync(async (req, res) => {
  const user = req.user as User
  const query: TQueryRecommendations = req.query
  const options = _.pick(query, ['topK', 'excludePurchased'])

  const result = await recommendationService.getPersonalizedRecommendations(user.id, options)
  sendResponse.success(res, result, 'Get personalized recommendations successfully!')
})

export default {
  getRecommendations,
  getSimilarProducts,
  trainModel,
  getPopularProducts,
  addRating,
  getPersonalizedRecommendations
}
