import httpStatus from 'http-status-codes'
import { Book, Category, Prisma } from '@prisma/client'
import csvParser from 'csv-parser'
import fs from 'fs'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */
const createCategory = async (data: Pick<Category, 'name' | 'slug'>): Promise<Category> => {
  const { name, slug } = data
  const maxCategoryId = await prisma.category.aggregate({
    _max: { categoryId: true }
  })
  const newCategoryId = (maxCategoryId._max.categoryId || 0) + 1
  return prisma.category.create({
    data: {
      categoryId: newCategoryId,
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
 * Get books by category id
 * @param {ObjectId} id
 * @param {Object} options - Query options
 * @returns {Promise<{ books: Book[], total: number }>}
 */
const getCategoryBooks = async <Key extends keyof Book>(
  slug: string,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['id', 'info', 'details'] as Key[]
): Promise<{ books: Pick<Book, 'id' | 'info' | 'details' | 'description'>[] | object[]; total: number }> => {
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

  // Get books with pagination
  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: {
        categoryId: categoryExists.categoryId,
        isDeleted: false
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }),
    prisma.book.count({
      where: {
        categoryId: categoryExists.categoryId,
        isDeleted: false
      }
    })
  ])

  return {
    books,
    total
  }
}

/**
 * Get category by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Category, Key> | null>}
 */
const getCategoryById = async <Key extends keyof Category>(id: string, keys: Key[] = ['id', 'name', 'slug', 'createdAt', 'updatedAt'] as Key[]): Promise<Pick<Category, Key> | null> => {
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
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async <Key extends keyof Category>(
  categoryId: string,
  updateBody: Prisma.CategoryUpdateInput,
  keys: Key[] = ['id', 'name', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Category, Key> | null> => {
  const category = await getCategoryById(categoryId, ['id'])
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }
  const updatedCategory = await prisma.category.update({
    where: { id: category.id, isDeleted: false },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedCategory as Pick<Category, Key> | null
}

/**
 * Delete category by id
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (categoryId: string): Promise<Category> => {
  const category = await getCategoryById(categoryId)
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }
  await prisma.category.update({
    where: { id: category.id },
    data: {
      isDeleted: true
    }
  })
  return category
}

const importCategories = async (filePath: string): Promise<boolean> => {
  const categories: Category[] = []
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row: Category) => categories.push(row))
        .on('end', resolve)
        .on('error', reject)
    })

    for (const category of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { categoryId: +category.categoryId }
      })
      if (!existingCategory) {
        await prisma.category.create({
          data: {
            categoryId: +category.categoryId,
            name: category.name,
            slug: category.slug
          }
        })
      }
    }

    return true
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  createCategory,
  queryCategories,
  getCategoryBooks,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  importCategories
}
