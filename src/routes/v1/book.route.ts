import express from 'express'

import auth from '@middlewares/auth'
import validate from '@middlewares/validate'

import { bookController } from '@/controllers'
import { bookValidation } from '@/validations'

const router = express.Router()

router.route('/').get(validate(bookValidation.getBooks), bookController.getBooks)
router.route('/').post(auth('manageBooks'), validate(bookValidation.createBook), bookController.createBook)

router
  .route('/:bookId')
  .get(validate(bookValidation.getBook), bookController.getBook)
  .patch(auth('manageBooks'), validate(bookValidation.updateBook), bookController.updateBook)
  .delete(auth('manageBooks'), validate(bookValidation.deleteBook), bookController.deleteBook)

export default router
