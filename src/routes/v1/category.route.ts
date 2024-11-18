import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { categoryController } from '@/controllers'
import { categoryValidation } from '@/validations'
import { uploadCSV } from '@/middlewares/upload'

const router = express.Router()

router.route('/').get(validate(categoryValidation.getCategories), categoryController.getCategories)
router.route('/').post(auth('manageCategories'), validate(categoryValidation.createCategory), categoryController.createCategory)

router.route('/import').post(auth('manageCategories'), uploadCSV.single('file'), categoryController.importCategories)

router
  .route('/:categoryId')
  .get(validate(categoryValidation.getCategory), categoryController.getCategory)
  .patch(auth('manageCategories'), validate(categoryValidation.updateCategory), categoryController.updateCategory)
  .delete(auth('manageCategories'), validate(categoryValidation.deleteCategory), categoryController.deleteCategory)

router.route('/:slug/books').get(validate(categoryValidation.getBooksOfCategory), categoryController.getBooksOfCategory)

export default router
