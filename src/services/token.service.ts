import jwt from 'jsonwebtoken'
import httpStatus from 'http-status-codes'
import moment, { Moment } from 'moment'
import { Token, TokenType } from '@prisma/client'

import prisma from '@/client'
import config from '@configs/config'
import ApiError from '@utils/ApiError'
import userService from '@services/user.service'
import { AuthTokensResponse } from '@/types/response'

/**
 * Generate token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId: string, expires: Moment, type: TokenType, secret = config.jwt.secret): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type
  }
  return jwt.sign(payload, secret)
}

/**
 * Save a token
 * @param {string} token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token: string, userId: string, expires: Moment, type: TokenType, blacklisted = false): Promise<Token> => {
  const createdToken = prisma.token.create({
    data: {
      token,
      userId,
      expires: expires.toDate(),
      type,
      blacklisted
    }
  })
  return createdToken
}

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
  const payload = jwt.verify(token, config.jwt.secret)
  const userId = String(payload.sub)
  const tokenData = await prisma.token.findFirst({
    where: { token, type, userId, blacklisted: false }
  })
  if (!tokenData) {
    throw new Error('Token not found')
  }
  return tokenData
}

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user: { userId: string }): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes')
  const accessToken = generateToken(user.userId, accessTokenExpires, TokenType.ACCESS)

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days')
  const refreshToken = generateToken(user.userId, refreshTokenExpires, TokenType.REFRESH)
  await saveToken(refreshToken, user.userId, refreshTokenExpires, TokenType.REFRESH)

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate()
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate()
    }
  }
}

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email')
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes')
  const resetPasswordToken = generateToken(user.userId, expires, TokenType.RESET_PASSWORD)
  await saveToken(resetPasswordToken, user.userId, expires, TokenType.RESET_PASSWORD)
  return resetPasswordToken
}

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: { userId: string }): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes')
  const verifyEmailToken = generateToken(user.userId, expires, TokenType.VERIFY_EMAIL)
  await saveToken(verifyEmailToken, user.userId, expires, TokenType.VERIFY_EMAIL)
  return verifyEmailToken
}

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken
}
