import httpStatus from 'http-status-codes'
import { Product, Category, Prisma } from '@prisma/client'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */
const createCategory = async (data: Pick<Category, 'name' | 'slug'>): Promise<Category> => {
  const { name, slug } = data
  return prisma.category.create({
    data: {
      name,
      slug
    }
  })
}

/**
 * Query for categories
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCategories = async <Key extends keyof Category>(
  filter: object,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['id', 'name', 'slug', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Category, Key>[]> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const categories = await prisma.category.findMany({
    where: { ...filter, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined
  })
  return categories as Pick<Category, Key>[]
}

/**
 * Get products by category id
 * @param {ObjectId} id
 * @param {Object} options - Query options
 * @returns {Promise<{ products: Product[], total: number }>}
 */
const getProductsOfCategory = async (
  slug: string,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  }
): Promise<{ name: string; products: Product[] | object[]; totalPages: number }> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  // Check if category exists
  const categoryExists = await prisma.category.findFirst({
    where: { slug, isDeleted: false }
  })

  if (!categoryExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }

  // Get products with pagination
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: categoryExists.id,
        isDeleted: false
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined
    }),
    prisma.product.count({
      where: {
        categoryId: categoryExists.id,
        isDeleted: false
      }
    })
  ])

  return {
    name: categoryExists.name,
    products,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Get category by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Category, Key> | null>}
 */
const getCategoryById = async <Key extends keyof Category>(id: string, keys: Key[] = ['name', 'slug', 'createdAt', 'updatedAt'] as Key[]): Promise<Pick<Category, Key> | null> => {
  const category = (await prisma.category.findUnique({
    where: { id, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })) as Pick<Category, Key> | null

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }

  return category
}

/**
 * Update category by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async <Key extends keyof Category>(
  id: string,
  updateBody: Prisma.CategoryUpdateInput,
  keys: Key[] = ['id', 'name', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Category, Key> | null> => {
  const category = await getCategoryById(id)
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }
  const updatedCategory = await prisma.category.update({
    where: { id, isDeleted: false },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedCategory as Pick<Category, Key> | null
}

/**
 * Delete category by id
 * @param {ObjectId} id
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (id: string): Promise<Category> => {
  const category = await getCategoryById(id)
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }
  await prisma.category.update({
    where: { id },
    data: {
      isDeleted: true
    }
  })
  return category
}

export default {
  createCategory,
  queryCategories,
  getProductsOfCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById
}
