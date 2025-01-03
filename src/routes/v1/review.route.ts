import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { reviewController } from '@/controllers'
import { reviewValidation } from '@/validations'
import { uploadCSV } from '@/middlewares/upload'

const router = express.Router()

router.route('/').get(validate(reviewValidation.getReviews), reviewController.getReviews).post(auth(), validate(reviewValidation.createReview), reviewController.createReview)

router.route('/import').post(auth('manageReviews'), uploadCSV.single('file'), reviewController.importReviews)

router
  .route('/:reviewId')
  .get(validate(reviewValidation.getReview), reviewController.getReview)
  .patch(auth(), validate(reviewValidation.updateReview), reviewController.updateReview)
  .delete(auth(), validate(reviewValidation.deleteReview), reviewController.deleteReview)

export default router
