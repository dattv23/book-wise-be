import express, { RequestHandler } from 'express'

import auth from '@middlewares/auth'

import { exportController } from '@/controllers'
import validate from '@/middlewares/validate'
import { reviewValidation } from '@/validations'

const router = express.Router()

router.route('/reviews').get(auth('mngExport'), validate(reviewValidation.getReviews), exportController.exportReviews as unknown as RequestHandler)

export default router
