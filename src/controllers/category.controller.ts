import _ from 'lodash'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { categoryService } from '@/services'
import { TQueryCategories } from '@/validations/category.validation'

const createCategory = catchAsync(async (req, res) => {
  const { name } = req.body
  const category = await categoryService.createCategory({ name })
  sendResponse.created(res, category, 'Create category successfully!')
})

const getCategories = catchAsync(async (req, res) => {
  const query: TQueryCategories = req.query
  const filter = _.pick(query, ['name'])
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await categoryService.queryCategories(filter, options)
  sendResponse.success(res, result, 'Get categories successfully!')
})

const getCategoryBooks = catchAsync(async (req, res) => {
  const query: TQueryCategories = req.query
  const options = _.pick(query, ['sortBy', 'limit', 'page'])
  const result = await categoryService.getCategoryBooks(req.params.categoryId, options)
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

export default {
  createCategory,
  getCategories,
  getCategoryBooks,
  getCategory,
  updateCategory,
  deleteCategory
}
