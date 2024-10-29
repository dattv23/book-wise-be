import z from 'zod'
import { objectIdSchema, paginationAndSortingSchema } from './custom.validation'

export const createCategory = {
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required')
  })
} as const

const getCategoryBooks = {
  params: z.object({
    categoryId: objectIdSchema
  }),
  query: paginationAndSortingSchema
} as const

export type TGetCategoryBook = z.infer<typeof getCategoryBooks.query>

const getCategories = {
  query: z
    .object({
      // Filter fields
      name: z.string().optional()
    })
    .merge(paginationAndSortingSchema)
} as const

export type TQueryCategories = z.infer<typeof getCategories.query>

const getCategory = {
  params: z.object({
    categoryId: objectIdSchema
  })
} as const

export const updateCategory = {
  params: z.object({
    categoryId: objectIdSchema
  }),
  body: z
    .object({
      name: z.string().min(1, 'Name is required').optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      path: ['common'],
      message: 'At least one field must be provided for update'
    })
} as const

// Type for the update body
export type TUpdateCategory = z.infer<typeof updateCategory.body>

const deleteCategory = {
  params: z.object({
    categoryId: objectIdSchema
  })
} as const

export default {
  createCategory,
  getCategoryBooks,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
}
