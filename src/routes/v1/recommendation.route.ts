import recommendationController from '@/controllers/recommendation.controller'
import auth from '@/middlewares/auth'
import express from 'express'

const router = express.Router()

router.route('/').get(auth(), recommendationController.getRecommendations)

export default router
