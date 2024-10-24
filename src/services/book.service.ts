import httpStatus from 'http-status-codes'
import { Book, Prisma } from '@prisma/client'

import prisma from '@/client'
import ApiError from '@utils/ApiError'

/**
 * Create a book
 * @param {Object} bookBody
 * @returns {Promise<Book>}
 */
const createBook = async (data: Pick<Book, 'info' | 'details'>, categoryId: string): Promise<Book> => {
  const { info, details } = data
  return prisma.book.create({
    data: {
      info,
      details,
      categoryId
    }
  })
}

/**
 * Query for books
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBooks = async <Key extends keyof Book>(
  filter: object,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['id', 'info', 'details', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Book, Key>[]> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const books = await prisma.book.findMany({
    where: { ...filter, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined
  })
  return books as Pick<Book, Key>[]
}

/**
 * Get book by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Book, Key> | null>}
 */
const getBookById = async <Key extends keyof Book>(id: string, keys: Key[] = ['id', 'info', 'details', 'categoryId', 'createdAt', 'updatedAt'] as Key[]): Promise<Pick<Book, Key> | null> => {
  const book = (await prisma.book.findUnique({
    where: { id, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })) as Pick<Book, Key> | null

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found')
  }

  return book
}

/**
 * Update book by id
 * @param {ObjectId} bookId
 * @param {Object} updateBody
 * @returns {Promise<Book>}
 */
const updateBookById = async <Key extends keyof Book>(
  bookId: string,
  updateBody: Prisma.BookUpdateInput,
  keys: Key[] = ['id', 'info', 'details', 'categoryId'] as Key[]
): Promise<Pick<Book, Key> | null> => {
  const book = await getBookById(bookId, ['id'])
  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found')
  }
  const updatedBook = await prisma.book.update({
    where: { id: book.id, isDeleted: false },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedBook as Pick<Book, Key> | null
}

/**
 * Delete book by id
 * @param {ObjectId} bookId
 * @returns {Promise<Book>}
 */
const deleteBookById = async (bookId: string): Promise<Book> => {
  const book = await getBookById(bookId)
  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found')
  }
  await prisma.book.update({
    where: { id: book.id },
    data: {
      isDeleted: true
    }
  })
  return book
}

export default {
  createBook,
  queryBooks,
  getBookById,
  updateBookById,
  deleteBookById
}
