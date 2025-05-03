import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { Request } from 'express'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/')
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + file.filename
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

// File filter function to check file type
const fileImageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedFileTypes = ['image/jpeg', 'image/png']
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid file type. Only CSV, JPEG, and PNG are allowed.'))
  }
}

const fileCSVFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedFileTypes = ['text/csv']
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid file type. Only CSV file are allowed.'))
  }
}

// Multer upload configuration
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB file size limit
  },
  fileFilter: fileImageFilter
})

const uploadCSV = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB file size limit
  },
  fileFilter: fileCSVFilter
})

export { uploadImage, uploadCSV }
