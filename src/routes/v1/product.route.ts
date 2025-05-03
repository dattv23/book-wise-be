import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { productController } from '@/controllers'
import { productValidation } from '@/validations'

const router = express.Router()

router.route('/').get(validate(productValidation.getProducts), productController.getProducts)
router.route('/').post(auth('mngProduct'), validate(productValidation.createProduct), productController.createProduct)

router.route('/top-selling').get(productController.topSales)

router
  .route('/:productId')
  .get(validate(productValidation.getProduct), productController.getProduct)
  .patch(auth('mngProduct'), validate(productValidation.updateProduct), productController.updateProduct)
  .delete(auth('mngProduct'), validate(productValidation.deleteProduct), productController.deleteProduct)

router.route('/:productId/reviews').get(validate(productValidation.getProductReviews), productController.getProductReviews)

export default router
