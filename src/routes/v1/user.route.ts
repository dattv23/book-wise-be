import express from 'express'

import auth from '@middlewares/auth'
import { uploadCSV } from '@/middlewares/upload'
import validate from '@middlewares/validate'

import { userController } from '@/controllers'
import { userValidation } from '@/validations'

const router = express.Router()

router.route('/').get(auth('mngUser'), validate(userValidation.getUsers), userController.getUsers)
router.route('/').post(auth('mngUser'), validate(userValidation.createUser), userController.createUser)

router.route('/import').post(auth('mngUser'), uploadCSV.single('file'), userController.importUsers)

router
  .route('/:userId')
  .get(auth('mngUser'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('mngUser'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('mngUser'), validate(userValidation.deleteUser), userController.deleteUser)

export default router
