import z from 'zod'

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .regex(passwordRegex, 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number')

// Regular expression for MongoDB ObjectID validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/

// Custom validator for MongoDB ObjectID
const objectIdSchema = z.string().min(1, 'ID is required').regex(objectIdRegex, 'Invalid ID format')

export { passwordSchema, objectIdSchema }
