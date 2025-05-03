import _ from 'lodash'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { productService } from '@/services'
import { TQueryProducts } from '@/validations/product.validation'

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.body.categoryId)
  sendResponse.created(res, product, 'Create product successfully!')
})

const getProducts = catchAsync(async (req, res) => {
  const query: TQueryProducts = req.query
  const filter = _.pick(query, ['author', 'categoryId'])
  const options = _.pick(query, ['sortBy', 'limit', 'page', 'search', 'categories'])
  const result = await productService.queryProducts(filter, options)
  sendResponse.success(res, result, 'Get products successfully!')
})

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.productId)
  sendResponse.success(res, product, 'Get product successfully!')
})

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProductById(req.params.productId, req.body)
  sendResponse.success(res, product, 'Update product successfully!')
})

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProductById(req.params.productId)
  sendResponse.noContent(res, {}, 'Delete product successfully!')
})

const topSales = catchAsync(async (req, res) => {
  const result = await productService.topSales()
  sendResponse.success(res, result, 'Get top sales successfully!')
})

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  topSales
}
