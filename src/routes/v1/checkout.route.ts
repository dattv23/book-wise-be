import express from 'express'

import checkoutController from '@/controllers/checkout.controller'

const router = express.Router()

router.route('/vnpay-return').get(checkoutController.vnpayReturnUrl)
router.route('/vnpay-ipn').get(checkoutController.vnpayIPN)

export default router
