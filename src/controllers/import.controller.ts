import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { importService } from '@/services'

const importProducts = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importProducts(file.path)
  sendResponse.success(res, {}, 'Import products successfully!')
})

const importAuthors = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importAuthors(file.path)
  sendResponse.success(res, {}, 'Import authors successfully!')
})

const importCategories = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importCategories(file.path)
  sendResponse.success(res, {}, 'Import categories successfully!')
})

const importSpecifications = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importSpecifications(file.path)
  sendResponse.success(res, {}, 'Import authors successfully!')
})

const importStores = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importStores(file.path)
  sendResponse.success(res, {}, 'Import stores successfully!')
})

const importUsers = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importUsers(file.path)
  sendResponse.success(res, {}, 'Import users successfully!')
})

const importReviews = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importReviews(file.path)
  sendResponse.success(res, {}, 'Import reviews successfully!')
})

const importProductAuthors = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    return sendResponse.badRequest(res, {}, 'File is required!')
  }
  await importService.importProductAuthors(file.path)
  sendResponse.success(res, {}, 'Import product authors successfully!')
})

export default { importProducts, importAuthors, importCategories, importSpecifications, importStores, importUsers, importReviews, importProductAuthors }
