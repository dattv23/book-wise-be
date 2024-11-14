import _ from 'lodash'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { categoryService } from '@/services'
import { TQueryCategories } from '@/validations/category.validation'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createCategory = catchAsync(async (req, res) => {
  const { name, slug } = req.body
  const category = await categoryService.createCategory({ name, slug })
  sendResponse.created(res, category, 'Create category successfully!')
})

const getCategories = catchAsync(async (req, res) => {
  const query: TQueryCategories = req.query
  const filter = _.pick(query, ['name'])
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await categoryService.queryCategories(filter, options)
  sendResponse.success(res, result, 'Get categories successfully!')
})

const getBooksOfCategory = catchAsync(async (req, res) => {
  const query: TQueryCategories = req.query
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await categoryService.getBooksOfCategory(req.params.slug, options)
  sendResponse.success(res, result, 'Get category books successfully!')
})

const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId)
  sendResponse.success(res, category, 'Get category successfully!')
})

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategoryById(req.params.categoryId, req.body)
  sendResponse.success(res, category, 'Update category successfully!')
})

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategoryById(req.params.categoryId)
  sendResponse.noContent(res, {}, 'Delete category successfully!')
})

const importCategories = catchAsync(async (req, res) => {
  const file = req.file

  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No file provided')
  }

  await categoryService.importCategories(file.path)
  sendResponse.success(res, {}, 'Import categories successfully!')
})

export default {
  createCategory,
  getCategories,
  getBooksOfCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  importCategories
}
