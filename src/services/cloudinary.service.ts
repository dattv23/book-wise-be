import { v2 as cloudinary } from 'cloudinary'

import config from '@configs/config'
import deleteLocalFile from '@/helpers/deleteLocalFile'
import logger from '@/configs/logger'
import _ from 'lodash'

cloudinary.config({
  secure: true,
  url: config.cloudinary.url
})

const uploadImage = async (folder: string, filePath: string) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    folder
  }

  try {
    const { secure_url: url, public_id: publicId } = await cloudinary.uploader.upload(filePath, options)
    deleteLocalFile(filePath)
    return { url, publicId }
  } catch (error) {
    logger.error(error)
    deleteLocalFile(filePath)
  }
}

const uploadImages = async (folder: string, filePaths: string[]) => {
  try {
    const results = await Promise.all(filePaths.map((fieldPath) => uploadImage(folder, fieldPath)))

    await Promise.all(filePaths.map(deleteLocalFile))

    return _.compact(results)
  } catch (error) {
    logger.error(error)
    await Promise.all(filePaths.map(deleteLocalFile))
  }
}

export default { uploadImage, uploadImages }
