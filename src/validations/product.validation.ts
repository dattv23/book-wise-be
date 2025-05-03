import z from 'zod'

export const createProduct = {
  body: z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
    originalPrice: z.number().int().nonnegative({ message: 'Original price must be a non-negative integer' }),
    discount: z.number().int().min(0).max(100).default(0),
    thumbnailUrl: z.string().url({ message: 'Thumbnail URL must be a valid URL' }),
    stockQuantity: z.number().int().nonnegative({ message: 'Stock quantity must be a non-negative integer' }),
    shortDescription: z.string().optional(),
    description: z.string().optional().default(''),
    galleryImages: z
      .array(z.string().url({ message: 'Each gallery image must be a valid URL' }))
      .optional()
      .default([]),
    originalId: z.number().int().nonnegative().optional().default(0),

    storeId: z.string().length(24, 'storeId must be a valid ObjectId'),
    categoryId: z.string().length(24, 'categoryId must be a valid ObjectId')
  })
} as const

const getProducts = {
  query: z.object({
    // Filter fields
    sortType: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional(),
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    categoryId: z.string().length(24, 'categoryId must be a valid ObjectId').optional(),
    storeId: z.string().length(24, 'storeId must be a valid ObjectId').optional()
  })
} as const

export type TQueryProducts = z.infer<typeof getProducts.query>

const getProduct = {
  params: z.object({
    productId: z.string()
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

const getProductReviews = {
  params: z.object({
    productId: z.string()
  }),
  query: z.object({
    sortBy: z.string().optional(),
    sortType: z.enum(['asc', 'desc']).optional(),
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional()
  })
} as const

export type TQueryProductReviews = z.infer<typeof getProductReviews.query>

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductReviews
}
