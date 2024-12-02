import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { orderController } from '@/controllers'
import { orderValidation } from '@/validations'

const router = express.Router()

router.route('/').post(auth(), validate(orderValidation.createOrder), orderController.createOrder).get(auth('mngOrders'), validate(orderValidation.getOrders), orderController.getOrders)

router.route('/:orderId').get(auth(), validate(orderValidation.getOrder), orderController.getOrder)

router.route('/vnpay-return').get(orderController.vnpayReturnUrl)
router.route('/vnpay-ipn').get(orderController.vnpayIPN)

export default router
