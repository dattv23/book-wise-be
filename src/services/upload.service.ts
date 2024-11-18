import ApiError from '@/utils/ApiError'
import cloudinaryService from './cloudinary.service'
import { StatusCodes } from 'http-status-codes'
import logger from '@/configs/logger'

const uploadImage = async (filePath: string): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinaryService.uploadImage('images', filePath)

    if (!result) {
      throw new Error()
    }

    return result
  } catch (error) {
    logger.error(error)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error uploading image to cloud storage')
  }
}

const uploadImages = async (filePaths: string[]): Promise<{ url: string; publicId: string }[] | undefined> => {
  try {
    const result = await cloudinaryService.uploadImages('images', filePaths)

    if (!result || result.length === 0) {
      throw new Error()
    }

    return result
  } catch (error) {
    logger.error(error)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error uploading image to cloud storage')
  }
}

export default {
  uploadImage,
  uploadImages
}
