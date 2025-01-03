import httpStatus from 'http-status-codes'
import { AnyZodObject, ZodEffects, ZodError } from 'zod'
import { NextFunction, Request, Response } from 'express'

import ApiError from '@utils/ApiError'

type ZodSchema = {
  params?: AnyZodObject
  query?: AnyZodObject
  body?: AnyZodObject | ZodEffects<AnyZodObject>
}

const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params)
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query)
    }
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body)
    }
    return next()
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((e) => {
        return {
          [e.path[0]]: e.message
        }
      })
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Validation error', errors))
    }
    return next(error)
  }
}

export default validate
