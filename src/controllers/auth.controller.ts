import _ from 'lodash'
import { User } from '@prisma/client'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'
import { authService, userService, tokenService, emailService } from '@/services'

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body
  const user = await userService.createUser(email, password, name)
  const userWithoutPassword = _.omit(user, ['password', 'createdAt', 'updatedAt'])
  const tokens = await tokenService.generateAuthTokens(user)
  sendResponse.created(res, { user: userWithoutPassword, tokens }, 'Created account successfully!')
})

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body
  const user = await authService.loginUserWithEmailAndPassword(email, password)
  const userWithoutPassword = _.omit(user, ['password', 'createdAt', 'updatedAt'])
  const tokens = await tokenService.generateAuthTokens(user)
  sendResponse.success(res, { user: userWithoutPassword, tokens }, 'User logged in successfully!')
})

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken)
  sendResponse.noContent(res, {}, 'User logged out successfully!')
})

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken)
  sendResponse.created(res, tokens, 'Refresh tokens successfully!')
})

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email)
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken)
  sendResponse.noContent(res, {}, 'Send forgot password token successfully!')
})

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password)
  sendResponse.noContent(res, {}, 'Reset password successfully!')
})

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user)
  await emailService.sendVerificationEmail(user.email, verifyEmailToken)
  sendResponse.noContent(res, {}, 'Send verification email successfully!')
})

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string)
  sendResponse.noContent(res, {}, 'Verification email successfully!')
})

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
}
