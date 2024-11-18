import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { uploadService } from '@/services'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const uploadImage = catchAsync(async (req, res) => {
  const file = req.file
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No image file provided!')
  }
  const result = await uploadService.uploadImage(file.path)
  sendResponse.created(res, result, 'Upload image successfully!')
})

const uploadImages = catchAsync(async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No image files provided')
  }

  const filePaths = req.files.map((file) => file.path)
  const results = await uploadService.uploadImages(filePaths)
  sendResponse.created(res, results, 'Upload images successfully!')
})

export default { uploadImage, uploadImages }
