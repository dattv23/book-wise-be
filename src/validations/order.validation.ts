import { PaymentMethod } from '@prisma/client'
import z from 'zod'
import { paginationAndSortingSchema } from './custom.validation'

const orderItemSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer')
})

const createOrder = {
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'At least one order item is required'),
    subTotal: z.number().nonnegative('Subtotal must be a non-negative number'),
    shippingCost: z.number().nonnegative('Shipping cost must be a non-negative number'),
    total: z.number().positive('Total must be a positive number'),
    address: z.string().min(1, 'Address is required'),
    phoneNumber: z.string().regex(/^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/, 'Invalid phone number format'),
    paymentMethod: z.nativeEnum(PaymentMethod)
  })
} as const

const getOrders = {
  query: z
    .object({
      // Filter fields
      userId: z.string().uuid().optional()
    })
    .merge(paginationAndSortingSchema)
} as const

export type TQueryOrders = z.infer<typeof getOrders.query>

const getOrder = {
  params: z.object({
    orderId: z.string().uuid()
  })
} as const

export default { createOrder, getOrders, getOrder }
