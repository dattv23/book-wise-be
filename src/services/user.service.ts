import httpStatus from 'http-status-codes'
import { User, Role, Prisma } from '@prisma/client'
import csvParser from 'csv-parser'
import fs from 'fs'

import prisma from '@/client'
import ApiError from '@utils/ApiError'
import { encryptPassword } from '@utils/encryption'

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (email: string, password: string, name: string, role: Role = Role.USER): Promise<User> => {
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }

  const maxUserId = await prisma.user.aggregate({
    _max: { userId: true }
  })

  const newUserId = (maxUserId._max.userId || 0) + 1

  return prisma.user.create({
    data: {
      userId: newUserId,
      email,
      password: await encryptPassword(password),
      name,
      role
    }
  })
}

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async <Key extends keyof User>(
  filter: object,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['id', 'email', 'name', 'role', 'isEmailVerified', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<User, Key>[]> => {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const sortBy = options.sortBy
  const sortType = options.sortType ?? 'desc'
  const users = await prisma.user.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined
  })
  return users as Pick<User, Key>[]
}

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserById = async <Key extends keyof User>(id: string, keys: Key[] = ['id', 'email', 'name', 'role', 'isEmailVerified'] as Key[]): Promise<Pick<User, Key> | null> => {
  const user = prisma.user.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<User, Key> | null>

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  return user
}

/**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserByEmail = async <Key extends keyof User>(
  email: string,
  keys: Key[] = ['id', 'email', 'name', 'password', 'role', 'isEmailVerified', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<User, Key> | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<User, Key> | null>
}

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(userId: string, updateBody: Prisma.UserUpdateInput, keys: Key[] = ['id', 'email', 'name', 'role'] as Key[]): Promise<Pick<User, Key> | null> => {
  const user = await getUserById(userId, ['id', 'email', 'name'])
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  })
  return updatedUser as Pick<User, Key> | null
}

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: string): Promise<User> => {
  const user = await getUserById(userId)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  await prisma.user.delete({ where: { id: user.id } })
  return user
}

const importUsers = async (filePath: string): Promise<boolean> => {
  const users: User[] = []
  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row: User) => users.push(row))
        .on('end', resolve)
        .on('error', reject)
    })

    for (const user of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      })
      if (!existingUser) {
        await prisma.user.create({
          data: {
            userId: +user.userId,
            email: user.email,
            password: await encryptPassword(user.password),
            name: user.name,
            role: user.role as Role
          }
        })
      }
    }

    return true
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  importUsers
}
