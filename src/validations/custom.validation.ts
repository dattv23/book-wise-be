import z from 'zod'

import { objectIdRegex, passwordRegex } from '@/utils/regex'

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .regex(passwordRegex, 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number')

// Custom validator for MongoDB ObjectID
const objectIdSchema = z.string().min(1, 'ID is required').regex(objectIdRegex, 'Invalid ID format')

const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional()
})

const sortingSchema = z.object({
  sortBy: z.string().optional()
})

// Combining pagination and sorting for reuse
const paginationAndSortingSchema = paginationSchema.merge(sortingSchema)

export { passwordSchema, objectIdSchema, paginationAndSortingSchema }
