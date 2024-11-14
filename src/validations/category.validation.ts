import z from 'zod'
import { paginationAndSortingSchema } from './custom.validation'

export const createCategory = {
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
    slug: z.string({ required_error: 'Slug is required' }).min(1, 'Slug is required')
  })
} as const

const getBooksOfCategory = {
  params: z.object({
    slug: z.string({ required_error: 'Slug is required' })
  }),
  query: paginationAndSortingSchema
} as const

export type TGetCategoryBook = z.infer<typeof getBooksOfCategory.query>

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
    categoryId: z.string().uuid()
  })
} as const

export const updateCategory = {
  params: z.object({
    categoryId: z.string().uuid()
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
    categoryId: z.string().uuid()
  })
} as const

export default {
  createCategory,
  getBooksOfCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
}
