import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { bookController } from '@/controllers'
import { bookValidation } from '@/validations'
import { uploadCSV } from '@/middlewares/upload'

const router = express.Router()

router.route('/').get(validate(bookValidation.getBooks), bookController.getBooks)
router.route('/').post(auth('manageBooks'), validate(bookValidation.createBook), bookController.createBook)

router.route('/import').post(auth('manageBooks'), uploadCSV.single('file'), bookController.importBooks)
router.route('/top-selling').get(bookController.topSales)

router
  .route('/:bookId')
  .get(validate(bookValidation.getBook), bookController.getBook)
  .patch(auth('manageBooks'), validate(bookValidation.updateBook), bookController.updateBook)
  .delete(auth('manageBooks'), validate(bookValidation.deleteBook), bookController.deleteBook)

export default router
