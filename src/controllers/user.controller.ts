import _ from 'lodash'

import catchAsync from '@utils/catchAsync'
import sendResponse from '@configs/response'

import { userService } from '@/services'
import { TQueryUsers } from '@/validations/user.validation'
import ApiError from '@/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body
  const user = await userService.createUser(email, password, name, role)
  sendResponse.created(res, user, 'Create user successfully!')
})

const getUsers = catchAsync(async (req, res) => {
  const query: TQueryUsers = req.query
  const filter = _.pick(query, ['role'])
  const options = _.pick(query, ['sortBy', 'limit', 'page', 'search'])
  const result = await userService.queryUsers(filter, options)
  sendResponse.success(res, result, 'Get users successfully!')
})

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId)
  sendResponse.success(res, user, 'Get user successfully!')
})

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body)
  sendResponse.success(res, user, 'Update user successfully!')
})

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId)
  sendResponse.noContent(res, {}, 'Delete user successfully!')
})

const importUsers = catchAsync(async (req, res) => {
  const file = req.file

  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No file provided')
  }

  await userService.importUsers(file.path)
  sendResponse.success(res, {}, 'Import users successfully!')
})

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  importUsers
}
