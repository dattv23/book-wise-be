import _ from 'lodash'

import { getClientIp } from 'request-ip'
import { User } from '@prisma/client'

import catchAsync from '@/utils/catchAsync'

import sendResponse from '@configs/response'
import orderService from '@/services/order.service'
import { TQueryOrders } from '@/validations/order.validation'

const createOrder = catchAsync(async (req, res) => {
  const user = req.user as User
  const data = req.body
  const clientIp = getClientIp(req) || ''
  const result = await orderService.createOrder(data, user.userId, clientIp)
  sendResponse.success(res, result, 'Create order successfully!')
})

const getOrders = catchAsync(async (req, res) => {
  const query: TQueryOrders = req.query
  const filter = _.pick(query, ['bookId', 'userId'])
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await orderService.queryOrders(filter, options)
  sendResponse.success(res, result, 'Get orders successfully!')
})

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.orderId)
  sendResponse.success(res, order, 'Get order successfully!')
})

export default { createOrder, getOrders, getOrder }
