import express from 'express'

import auth from '@middlewares/auth'

import { uploadController } from '@/controllers'
import { uploadImage } from '@/middlewares/upload'

const router = express.Router()

router.route('/image').post(auth(), uploadImage.single('image'), uploadController.uploadImage)
router.route('/images').post(auth(), uploadImage.array('images'), uploadController.uploadImages)

export default router
