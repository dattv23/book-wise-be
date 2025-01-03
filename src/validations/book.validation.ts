import z from 'zod'

// Validation schema for BookInfo
const bookInfoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  imageUrl: z.string().url('Invalid image URL'),
  soldQuantity: z.number().optional().default(0),
  currentPrice: z.coerce.number().optional(),
  originalPrice: z.coerce.number()
})

// Validation schema for BookDetails
const bookDetailsSchema = z.object({
  publisher: z.string().min(1, 'Publisher is required'),
  publishingHouse: z.string().min(1, 'Publishing house is required'),
  bookVersion: z.string().optional(),
  publishDate: z.string().datetime().optional(),
  dimensions: z.string().optional(),
  translator: z.string().optional(),
  coverType: z.string().optional(),
  pageCount: z.string().optional()
})

export const createBook = {
  body: z.object({
    info: bookInfoSchema,
    details: bookDetailsSchema,
    description: z.string().optional().default(''),
    categoryId: z.string().uuid()
  })
} as const

const getBooks = {
  query: z.object({
    // Filter fields
    author: z.string().optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    categories: z.string().optional()
  })
} as const

export type TQueryBooks = z.infer<typeof getBooks.query>

const getBook = {
  params: z.object({
    bookId: z.string().uuid()
  })
} as const

// Partial schemas for nested updates
const partialBookInfoSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    author: z.string().min(1, 'Author is required').optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    soldQuantity: z.coerce.number().optional(),
    currentPrice: z.coerce.number().optional(),
    originalPrice: z.coerce.number().optional()
  })
  .strict()
  .optional()

const partialBookDetailsSchema = z
  .object({
    publisher: z.string().min(1, 'Publisher is required').optional(),
    publishingHouse: z.string().min(1, 'Publishing house is required').optional(),
    bookVersion: z.string().optional(),
    publishDate: z.string().datetime().optional(),
    dimensions: z.string().optional(),
    translator: z.string().optional(),
    coverType: z.string().optional(),
    pageCount: z.string().optional()
  })
  .strict()
  .optional()

const partialRatingSchema = z
  .object({
    totalRating: z.coerce.number().min(0).max(5).optional(),
    numberOfRating: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .optional()

// Base update schema without refinements
const updateBookBaseSchema = z
  .object({
    info: partialBookInfoSchema,
    details: partialBookDetailsSchema,
    rating: partialRatingSchema,
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    isDeleted: z.boolean().optional()
  })
  .strict()

export const updateBook = {
  params: z.object({
    bookId: z.string().uuid()
  }),
  body: updateBookBaseSchema.superRefine((data, ctx) => {
    // Check if at least one field is provided
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided for update'
      })
    }

    // Check rating consistency
    if (data.rating) {
      if (data.rating.totalRating === undefined || data.rating.numberOfRating === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Both totalRating and numberOfRating must be provided when updating rating'
        })
      }
    }
  })
} as const

// Type for the update body
export type TUpdateBook = z.infer<typeof updateBook.body>

const deleteBook = {
  params: z.object({
    bookId: z.string().uuid()
  })
} as const

export default {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook
}
