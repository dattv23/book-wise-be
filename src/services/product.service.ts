import httpStatus from 'http-status-codes'
import { Product, Prisma } from '@prisma/client'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a product
 * @param {Object} data
 * @returns {Promise<Product>}
 */
const createProduct = async (data: Product, categoryId: string): Promise<Product> => {
  return prisma.product.create({
    data: {
      ...data,
      categoryId
    }
  })
}

/**
 * Query for products
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async <Key extends keyof Product>(
  filter: object,
  options: {
    search?: string
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
    categories?: string
  },
  keys: Key[] = ['id', 'info', 'details', 'description', 'createdAt', 'updatedAt'] as Key[]
): Promise<{ products: Pick<Product, Key>[] | object[]; total: number; totalPages: number }> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const search = options.search ?? ''

  const selectObj = keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...filter,
        OR: [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }],
        isDeleted: false
      },
      select: {
        ...selectObj
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined
    }),
    prisma.product.count({
      where: {
        ...filter,
        OR: [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }],
        isDeleted: false
      }
    })
  ])
  return { products, total, totalPages: Math.ceil(total / limit) }
}

/**
 * Get product by id
 * @param {string} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Product, Key> | null>}
 */
const getProductById = async <Key extends keyof Product>(
  id: string,
  keys: Key[] = ['id', 'info', 'details', 'description', 'categoryId', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Product, Key> | null> => {
  const product = (await prisma.product.findUnique({
    where: { id, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })) as Pick<Product, Key> | null

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }

  return product
}

/**
 * Update product by id
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<Product>}
 */
const updateProductById = async <Key extends keyof Product>(
  id: string,
  updateBody: Prisma.ProductUpdateInput,
  keys: Key[] = ['id', 'info', 'details', 'description', 'categoryId'] as Key[]
): Promise<Pick<Product, Key> | null> => {
  const product = await getProductById(id, ['id'])
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }
  const updatedProduct = await prisma.product.update({
    where: { id, isDeleted: false },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedProduct as Pick<Product, Key> | null
}

/**
 * Delete product by id
 * @param {string} id
 * @returns {Promise<Product>}
 */
const deleteProductById = async (id: string): Promise<Product> => {
  const product = await getProductById(id)
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }
  await prisma.product.update({
    where: { id },
    data: {
      isDeleted: true
    }
  })
  return product
}

const topSales = async () => {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false // Exclude deleted products
    },
    take: 8 // Limit the number of results
  })

  return products
}

export default {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  topSales
}
