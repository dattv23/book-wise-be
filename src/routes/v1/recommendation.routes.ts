import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { recommendationController } from '@/controllers'
import { recommendationValidation } from '@/validations'

const router = express.Router()

// Public routes
router.route('/products/:productId/similar').get(validate(recommendationValidation.getSimilarProducts), recommendationController.getSimilarProducts)

// Authenticated user routes
router.route('/users/:userId/recommendations').get(auth(), validate(recommendationValidation.getRecommendations), recommendationController.getRecommendations)

router.route('/personalized').get(auth(), validate(recommendationValidation.getPersonalizedRecommendations), recommendationController.getPersonalizedRecommendations)

router.route('/ratings').post(auth(), validate(recommendationValidation.addRating), recommendationController.addRating)

// Admin-only route
router.route('/train').post(auth('ADMIN'), validate(recommendationValidation.trainModel), recommendationController.trainModel)

export default router
