import { z } from 'zod'

import 'dotenv/config'

const envValidation = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number({ description: 'minutes after which access tokens expire' }).default(30),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number({ description: 'days after which refresh tokens expire' }).default(30),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.coerce.number({ description: 'days after which reset password tokens expire' }).default(30),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.coerce.number({ description: 'days after which verify email tokens expire' }).default(30),
  LOG_FOLDER: z.string(),
  LOG_FILE: z.string(),
  LOG_LEVEL: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USERNAME: z.string(),
  SMTP_PASSWORD: z.string(),
  EMAIL_FROM: z.string(),
  CLOUDINARY_URL: z.string(),
  CLOUDINARY_FOLDER: z.string(),
  CLIENT_HOST: z.string(),
  MONGO_URI: z.string(),
  DATABASE_NAME: z.string()
})

const envVars = envValidation.parse(process.env)

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
  },
  logConfig: {
    logFolder: envVars.LOG_FOLDER,
    logFile: envVars.LOG_FILE,
    logLevel: envVars.LOG_LEVEL
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD
      }
    },
    from: envVars.EMAIL_FROM
  },
  cloudinary: {
    url: envVars.CLOUDINARY_URL,
    folder: envVars.CLOUDINARY_FOLDER
  },
  client: {
    host: envVars.CLIENT_HOST
  },
  database: {
    mongoUri: envVars.MONGO_URI,
    databaseName: envVars.DATABASE_NAME
  }
}
