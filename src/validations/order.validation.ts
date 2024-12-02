import { PaymentMethod } from '@prisma/client'
import z from 'zod'

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
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    paymentMethod: z.nativeEnum(PaymentMethod)
  })
} as const

export default { createOrder }
