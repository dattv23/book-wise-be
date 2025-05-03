import express from 'express'

import auth from '@middlewares/auth'

import { importController } from '@/controllers'
import { uploadCSV } from '@/middlewares/upload'

const router = express.Router()

router.route('/products').post(auth('mngImport'), uploadCSV.single('file'), importController.importProducts)
router.route('/product-authors').post(auth('mngImport'), uploadCSV.single('file'), importController.importProductAuthors)
router.route('/reviews').post(auth('mngImport'), uploadCSV.single('file'), importController.importReviews)
router.route('/categories').post(auth('mngImport'), uploadCSV.single('file'), importController.importCategories)
router.route('/authors').post(auth('mngImport'), uploadCSV.single('file'), importController.importAuthors)
router.route('/users').post(auth('mngImport'), uploadCSV.single('file'), importController.importUsers)
router.route('/stores').post(auth('mngImport'), uploadCSV.single('file'), importController.importStores)
router.route('/specifications').post(auth('mngImport'), uploadCSV.single('file'), importController.importSpecifications)

export default router
