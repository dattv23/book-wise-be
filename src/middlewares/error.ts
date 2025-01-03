import httpStatus from 'http-status-codes'
import { Prisma } from '@prisma/client'
import { ErrorRequestHandler } from 'express'

import config from '@configs/config'
import logger from '@configs/logger'

import ApiError from '@utils/ApiError'

export const errorConverter: ErrorRequestHandler = (err, req, res, next) => {
  let error = err
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof Prisma.PrismaClientKnownRequestError ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR
    const message = error.message || httpStatus.getStatusText(statusCode)
    error = new ApiError(statusCode, message, [], false, err.stack)
  }
  next(error)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let { statusCode, message } = err
  const { errors } = err
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR
    message = httpStatus.getStatusText(statusCode)
  }

  res.locals.errorMessage = err.message

  const response = {
    statusCode,
    message,
    errors,
    ...(config.env === 'development' && { stack: err.stack })
  }

  if (config.env === 'development') {
    logger.error(err)
  }

  res.status(statusCode).send(response)
}
