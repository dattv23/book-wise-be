import { PaymentStatus, User } from '@prisma/client'
import { getClientIp } from 'request-ip'
import querystring from 'qs'
import crypto from 'crypto'

import catchAsync from '@/utils/catchAsync'
import sendResponse from '@configs/response'
import orderService from '@/services/order.service'
import config from '@/configs/config'
import sortObject from '@/utils/sortObject'
import prisma from '@/client'

const createOrder = catchAsync(async (req, res) => {
  const user = req.user as User
  const data = req.body
  const clientIp = getClientIp(req) || ''
  const result = await orderService.createOrder(data, user.userId, clientIp)
  if (typeof result === 'string') {
    res.redirect(result)
  }
  sendResponse.success(res, result, 'Create order successfully!')
})

const vnpayReturnUrl = catchAsync(async (req, res) => {
  let vnp_Params = req.query

  const secureHash = vnp_Params['vnp_SecureHash']

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']

  vnp_Params = sortObject(vnp_Params)

  const secretKey = config.vnPay.hashSecret

  const signData = querystring.stringify(vnp_Params, { encode: false })
  const hmac = crypto.createHmac('sha512', secretKey)
  const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')

  if (secureHash === signed) {
    res.redirect(`${config.client.host}/checkout/success`)
  } else {
    res.redirect(`${config.client.host}/checkout/failed`)
  }
})

const vnpayIPN = catchAsync(async (req, res) => {
  let vnp_Params = req.query
  const secureHash = vnp_Params['vnp_SecureHash']

  const orderId = vnp_Params['vnp_TxnRef']
  const rspCode = vnp_Params['vnp_ResponseCode']

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']

  vnp_Params = sortObject(vnp_Params)
  const secretKey = config.vnPay.hashSecret
  const signData = querystring.stringify(vnp_Params, { encode: false })
  const hmac = crypto.createHmac('sha512', secretKey)
  const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')

  const paymentStatus = '0'

  const order = await prisma.order.findFirst({ where: { orderId: orderId as string } })
  const checkOrderId = order ? true : false
  const checkAmount = !order || order.total / 100 != parseInt(vnp_Params['vnp_Amount'] as string) ? false : true
  if (secureHash === signed) {
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus == '0') {
          if (rspCode == '00') {
            await prisma.order.update({
              data: {
                paymentStatus: PaymentStatus.COMPLETED
              },
              where: {
                orderId: orderId as string
              }
            })
            res.status(200).json({ RspCode: '00', Message: 'Success' })
          } else {
            await prisma.order.update({
              data: {
                paymentStatus: PaymentStatus.FAILED
              },
              where: {
                orderId: orderId as string
              }
            })
            res.status(200).json({ RspCode: '00', Message: 'Success' })
          }
        } else {
          res.status(200).json({ RspCode: '02', Message: 'This order has been updated to the payment status' })
        }
      } else {
        res.status(200).json({ RspCode: '04', Message: 'Amount invalid' })
      }
    } else {
      res.status(200).json({ RspCode: '01', Message: 'Order not found' })
    }
  } else {
    res.status(200).json({ RspCode: '97', Message: 'Checksum failed' })
  }
})

export default { createOrder, vnpayReturnUrl, vnpayIPN }
