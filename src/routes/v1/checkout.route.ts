import express from 'express'

import checkoutController from '@/controllers/checkout.controller'

const router = express.Router()

router.route('/vnpay_return').get(checkoutController.vnpayReturnUrl)
router.route('/vnpay_ipn').get(checkoutController.vnpayIPN)

export default router
