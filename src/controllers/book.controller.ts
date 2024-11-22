import _ from 'lodash'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { bookService } from '@/services'
import { TQueryBooks } from '@/validations/book.validation'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createBook = catchAsync(async (req, res) => {
  const { info, details, description, categoryId } = req.body
  const book = await bookService.createBook({ info, details, description }, categoryId)
  sendResponse.created(res, book, 'Create book successfully!')
})

const getBooks = catchAsync(async (req, res) => {
  const query: TQueryBooks = req.query
  const filter = _.pick(query, ['author', 'categoryId'])
  const options = _.pick(query, ['sortBy', 'limit', 'page', 'search'])
  const result = await bookService.queryBooks(filter, options)
  sendResponse.success(res, result, 'Get books successfully!')
})

const getBook = catchAsync(async (req, res) => {
  const book = await bookService.getBookById(req.params.bookId)
  sendResponse.success(res, book, 'Get book successfully!')
})

const updateBook = catchAsync(async (req, res) => {
  const book = await bookService.updateBookById(req.params.bookId, req.body)
  sendResponse.success(res, book, 'Update book successfully!')
})

const deleteBook = catchAsync(async (req, res) => {
  await bookService.deleteBookById(req.params.bookId)
  sendResponse.noContent(res, {}, 'Delete book successfully!')
})

const importBooks = catchAsync(async (req, res) => {
  const file = req.file

  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No file provided')
  }

  await bookService.importBooks(file.path)
  sendResponse.success(res, {}, 'Import books successfully!')
})

const topSales = catchAsync(async (req, res) => {
  const result = await bookService.topSales()
  sendResponse.success(res, result, 'Get top sales successfully!')
})

export default {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  importBooks,
  topSales
}
