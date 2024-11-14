import httpStatus from 'http-status-codes'
import { Book, Category, Prisma } from '@prisma/client'
import csvParser from 'csv-parser'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

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
      categoryId: uuidv4(),
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
  keys: Key[] = ['categoryId', 'name', 'slug', 'createdAt', 'updatedAt'] as Key[]
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
const getBooksOfCategory = async <Key extends keyof Book>(
  slug: string,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['bookId', 'info'] as Key[]
): Promise<{ name: string; books: Pick<Book, 'bookId' | 'info'>[] | object[]; totalPages: number }> => {
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
    name: categoryExists.name,
    books,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Get category by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Category, Key> | null>}
 */
const getCategoryById = async <Key extends keyof Category>(
  categoryId: string,
  keys: Key[] = ['categoryId', 'name', 'slug', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Category, Key> | null> => {
  const category = (await prisma.category.findUnique({
    where: { categoryId, isDeleted: false },
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
  keys: Key[] = ['categoryId', 'name', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Category, Key> | null> => {
  const category = await getCategoryById(categoryId)
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
  }
  const updatedCategory = await prisma.category.update({
    where: { categoryId, isDeleted: false },
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
    where: { categoryId },
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

    await prisma.category.createMany({
      data: categories
    })

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
  getBooksOfCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  importCategories
}
