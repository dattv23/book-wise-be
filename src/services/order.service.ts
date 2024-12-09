import prisma from '@/client'
import vnPay from '@/libs/vnPay'
import ApiError from '@/utils/ApiError'
import { Order, PaymentMethod } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import httpStatus from 'http-status-codes'

/**
 * Create a order
 * @param {Object} data
 * @returns {Promise<Order | string>}
 */
const createOrder = async (
  data: Pick<Order, 'items' | 'subTotal' | 'shippingCost' | 'total' | 'address' | 'phoneNumber' | 'paymentMethod'>,
  userId: string,
  ipAddr: string
): Promise<Order | string> => {
  const orderId = uuidv4()
  const { items, subTotal, shippingCost, total, address, phoneNumber, paymentMethod } = data
  const result = await prisma.order.create({
    data: {
      orderId: orderId,
      userId,
      items,
      subTotal,
      shippingCost,
      total,
      address,
      phoneNumber,
      paymentMethod
    }
  })
  if (paymentMethod === PaymentMethod.VN_PAY) {
    const urlPayment = vnPay.createPaymentUrl(orderId, total, null, 'vn', ipAddr)
    return urlPayment
  }
  return result
}

/**
 * Query for orders
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryOrders = async (
  filter: object, // { title: string, author: string }
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  }
): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { ...filter },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined
    }),
    prisma.order.count({
      where: { ...filter }
    })
  ])
  return { orders, total, totalPages: Math.ceil(total / limit) }
}

/**
 * Get order by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Order | null>}
 */
const getOrderById = async (id: string): Promise<Order | null> => {
  const order = (await prisma.order.findUnique({
    where: { id }
  })) as Order | null

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found')
  }

  return order
}

export default { createOrder, queryOrders, getOrderById }
