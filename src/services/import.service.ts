import httpStatus from 'http-status-codes'
import { Product } from '@prisma/client'
import csvParser from 'csv-parser'
import pLimit from 'p-limit'
import fs from 'fs'

import ApiError from '@utils/ApiError'
import prisma from '@/client'

const importProducts = async (filePath: string): Promise<boolean> => {
  const products: Product[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const productPromise = limit(async () => {
        products.push({
          ...row,
          productId: +row.productId,
          authorIds: row.authorIds != '' ? row.authorIds.split(';').map((id: string) => parseInt(id, 10)) : [],
          galleryImages: row.galleryImages != '' ? row.galleryImages.split(';').map((image: string) => image.trim()) : [],
          price: parseInt(row.price, 10),
          discount: parseInt(row.discount, 10),
          originalPrice: parseInt(row.originalPrice, 10),
          quantitySold: parseInt(row.quantitySold, 10),
          discountRate: parseInt(row.discountRate, 10),
          ratingAverage: parseFloat(row.ratingAverage),
          stockQuantity: parseInt(row.stockQuantity, 10),
          storeId: parseInt(row.storeId, 10),
          categoryId: parseInt(row.categoryId, 10),
          reviewCount: parseInt(row.reviewCount, 10)
        })

        if (products.length >= BATCH_SIZE) {
          await prisma.product.createMany({
            data: products
          })
          products.length = 0 // Clear the array after processing the batch
        }
      })

      await productPromise
    }

    if (products.length > 0) {
      await prisma.product.createMany({
        data: products
      })
    }

    await prisma.counter.create({
      data: {
        name: 'productId',
        sequence: products[products.length - 1].productId
      }
    })

    return true
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  importProducts
}
