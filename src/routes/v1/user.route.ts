import express from 'express'

import auth from '@middlewares/auth'
import upload from '@/middlewares/upload'
import validate from '@middlewares/validate'

import { userController } from '@/controllers'
import { userValidation } from '@/validations'

const router = express.Router()

router.route('/').get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers)
router.route('/').post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)

router.route('/import').post(auth('manageUsers'), upload.single('file'), userController.importUsers)

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser)

export default router
