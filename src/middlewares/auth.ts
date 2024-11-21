/* eslint-disable @typescript-eslint/no-explicit-any */
import passport from 'passport'
import httpStatus from 'http-status-codes'
import { User } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'

import ApiError from '@utils/ApiError'
import { roleRights } from '@configs/roles'

const verifyCallback = (req: any, resolve: (value?: unknown) => void, reject: (reason?: unknown) => void, requiredRights: string[]) => async (err: unknown, user: User | false, info: unknown) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'))
  }

  req.user = user

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role) ?? []
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight))
    if (!hasRequiredRights && req.params.userId !== user.userId) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'))
    }
  }

  resolve()
}

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next)
    })
      .then(() => next())
      .catch((err) => next(err))
  }

export default auth
