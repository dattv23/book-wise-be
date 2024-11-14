import httpStatus from 'http-status-codes'
import { Book, Prisma } from '@prisma/client'
import csvParser from 'csv-parser'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

import prisma from '@/client'
import ApiError from '@utils/ApiError'
import { safeJSONParse } from '@/helpers/safeJSONParse'

/**
 * Create a book
 * @param {Object} data
 * @returns {Promise<Book>}
 */
const createBook = async (data: Pick<Book, 'info' | 'details' | 'description'>, categoryId: string): Promise<Book> => {
  const { info, details, description } = data

  return prisma.book.create({
    data: {
      bookId: uuidv4(),
      info,
      details,
      description,
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
  keys: Key[] = ['bookId', 'info', 'details', 'description', 'createdAt', 'updatedAt'] as Key[]
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
 * @param {string} bookId
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Book, Key> | null>}
 */
const getBookById = async <Key extends keyof Book>(
  bookId: string,
  keys: Key[] = ['bookId', 'info', 'details', 'description', 'categoryId', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<Book, Key> | null> => {
  const book = (await prisma.book.findUnique({
    where: { bookId, isDeleted: false },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })) as Pick<Book, Key> | null

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found')
  }

  return book
}

/**
 * Update book by id
 * @param {string} bookId
 * @param {Object} updateBody
 * @returns {Promise<Book>}
 */
const updateBookById = async <Key extends keyof Book>(
  bookId: string,
  updateBody: Prisma.BookUpdateInput,
  keys: Key[] = ['bookId', 'info', 'details', 'description', 'categoryId'] as Key[]
): Promise<Pick<Book, Key> | null> => {
  const book = await getBookById(bookId, ['id'])
  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found')
  }
  const updatedBook = await prisma.book.update({
    where: { bookId, isDeleted: false },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedBook as Pick<Book, Key> | null
}

/**
 * Delete book by id
 * @param {string} bookId
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

const importBooks = async (filePath: string): Promise<boolean> => {
  const books: Book[] = []
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          // Safely parse the JSON strings
          const info = safeJSONParse(row.info)
          const details = safeJSONParse(row.details)

          if (info && details) {
            books.push({
              ...row,
              info,
              details
            })
          } else {
            console.warn(`Skipping row with bookId ${row.bookId} due to invalid JSON`)
          }
        })
        .on('end', resolve)
        .on('error', reject)
    })

    const bookPromises = books.map(async (book) => {
      const existingBook = await prisma.book.findUnique({
        where: { bookId: book.bookId }
      })

      if (!existingBook) {
        return prisma.book.create({
          data: {
            bookId: book.bookId,
            categoryId: book.categoryId,
            description: book.description,
            info: {
              set: {
                title: book.info.title,
                author: book.info.author || '',
                imageUrl: book.info.imageUrl || '',
                soldQuantity: book.info.soldQuantity,
                currentPrice: book.info.currentPrice,
                originalPrice: book.info.originalPrice
              }
            },
            details: {
              set: {
                publisher: book.details.publisher || null,
                publishingHouse: book.details.publishingHouse || null,
                bookVersion: book.details.bookVersion || null,
                publishDate: book.details.publishDate ? new Date(book.details.publishDate) : null,
                dimensions: book.details.dimensions || null,
                translator: book.details.translator || null,
                coverType: book.details.coverType || null,
                pageCount: book.details.pageCount || null
              }
            }
          }
        })
      }
    })

    // Run all book operations concurrently
    await Promise.all(bookPromises)

    return true
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  createBook,
  queryBooks,
  getBookById,
  updateBookById,
  deleteBookById,
  importBooks
}
