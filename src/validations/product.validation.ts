import z from 'zod'

// Validation schema for ProductInfo
const productInfoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  imageUrl: z.string().url('Invalid image URL'),
  soldQuantity: z.number().optional().default(0),
  currentPrice: z.coerce.number().optional(),
  originalPrice: z.coerce.number()
})

// Validation schema for ProductDetails
const productDetailsSchema = z.object({
  publisher: z.string().min(1, 'Publisher is required'),
  publishingHouse: z.string().min(1, 'Publishing house is required'),
  productVersion: z.string().optional(),
  publishDate: z.string().datetime().optional(),
  dimensions: z.string().optional(),
  translator: z.string().optional(),
  coverType: z.string().optional(),
  pageCount: z.string().optional()
})

export const createProduct = {
  body: z.object({
    info: productInfoSchema,
    details: productDetailsSchema,
    description: z.string().optional().default(''),
    categoryId: z.string().uuid()
  })
} as const

const getProducts = {
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

export type TQueryProducts = z.infer<typeof getProducts.query>

const getProduct = {
  params: z.object({
    productId: z.string().uuid()
  })
} as const

// Partial schemas for nested updates
const partialProductInfoSchema = z
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

const partialProductDetailsSchema = z
  .object({
    publisher: z.string().min(1, 'Publisher is required').optional(),
    publishingHouse: z.string().min(1, 'Publishing house is required').optional(),
    productVersion: z.string().optional(),
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
const updateProductBaseSchema = z
  .object({
    info: partialProductInfoSchema,
    details: partialProductDetailsSchema,
    rating: partialRatingSchema,
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    isDeleted: z.boolean().optional()
  })
  .strict()

export const updateProduct = {
  params: z.object({
    productId: z.string().uuid()
  }),
  body: updateProductBaseSchema.superRefine((data, ctx) => {
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
export type TUpdateProduct = z.infer<typeof updateProduct.body>

const deleteProduct = {
  params: z.object({
    productId: z.string().uuid()
  })
} as const

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
}
