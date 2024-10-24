import { z } from 'zod'
import { passwordSchema } from './custom.validation'

// Register
const register = {
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: passwordSchema, // Assume passwordSchema has custom messages,
    name: z.string({ required_error: 'Name is required' })
  })
} as const

// Login
const login = {
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' })
  })
} as const

// Logout
const logout = {
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' })
  })
} as const

// Refresh Tokens
const refreshTokens = {
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' })
  })
} as const

// Forgot Password
const forgotPassword = {
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format')
  })
} as const

// Reset Password
const resetPassword = {
  query: z.object({
    token: z.string({ required_error: 'Token is required' })
  }),
  body: z.object({
    password: passwordSchema // Assume passwordSchema has custom messages
  })
} as const

// Verify Email
const verifyEmail = {
  query: z.object({
    token: z.string({ required_error: 'Token is required' })
  })
} as const

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail
}
