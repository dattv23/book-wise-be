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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

// File filter function to check file type
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedFileTypes = ['text/csv', 'image/jpeg', 'image/png']
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid file type. Only CSV, JPEG, and PNG are allowed.'))
  }
}

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  },
  fileFilter: fileFilter
})

export default upload
