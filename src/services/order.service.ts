import prisma from '@/client'
import vnPay from '@/libs/vnPay'
import { Order, PaymentMethod } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

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
  const result = prisma.order.create({
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
    const urlPayment = vnPay.createPaymentUrl(orderId, total, vnPay.BankCode.VNBANK, 'vn', ipAddr)
    return urlPayment
  }
  return result
}

export default { createOrder }
