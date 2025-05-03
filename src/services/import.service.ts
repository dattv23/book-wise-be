import httpStatus from 'http-status-codes'
import csvParser from 'csv-parser'
import pLimit from 'p-limit'
import fs from 'fs'

import ApiError from '@utils/ApiError'
import prisma from '@/client'
import { Author, Category, Product, ProductAuthor, Review, Role, Specification, Store, User } from '@prisma/client'
import { encryptPassword } from '@/utils/encryption'

const importProducts = async (filePath: string) => {
  const products: Pick<
    Product,
    'name' | 'categoryId' | 'discount' | 'originalId' | 'originalPrice' | 'sku' | 'stockQuantity' | 'thumbnailUrl' | 'storeId' | 'description' | 'shortDescription' | 'galleryImages'
  >[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const store = await prisma.store.findFirst({
        where: {
          originalId: +row.storeId
        },
        select: {
          id: true
        }
      })

      const category = await prisma.category.findFirst({
        where: {
          originalId: +row.categoryId
        },
        select: {
          id: true
        }
      })

      if (!store) {
        throw new ApiError(httpStatus.NOT_FOUND, `Store with originalId ${row.storeId} not found`)
      }

      if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, `Category with originalId ${row.categoryId} not found`)
      }

      const productPromise = limit(async () => {
        products.push({
          categoryId: category.id,
          name: row.name,
          discount: +row.discountRate,
          originalId: +row.productId,
          originalPrice: +row.originalPrice,
          sku: row.sku,
          stockQuantity: +row.stockQuantity,
          thumbnailUrl: row.thumbnailUrl,
          storeId: store.id,
          description: row.description,
          shortDescription: row.shortDescription,
          galleryImages: row.galleryImages.split(';').map((image: string) => image.trim())
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
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importAuthors = async (filePath: string) => {
  const authors: Pick<Author, 'name' | 'slug' | 'originalId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const authorPromise = limit(async () => {
        authors.push({
          name: row.name.trim(),
          slug: row.slug.trim(),
          originalId: +row.authorId
        })

        if (authors.length >= BATCH_SIZE) {
          await prisma.author.createMany({
            data: authors
          })
          authors.length = 0 // Clear the array after processing the batch
        }
      })

      await authorPromise
    }

    if (authors.length > 0) {
      await prisma.author.createMany({
        data: authors
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importCategories = async (filePath: string) => {
  const categories: Pick<Category, 'name' | 'slug' | 'originalId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const categoriesPromise = limit(async () => {
        categories.push({
          name: row.name,
          slug: row.slug,
          originalId: +row.categoryId
        })

        if (categories.length >= BATCH_SIZE) {
          await prisma.category.createMany({
            data: categories
          })
          categories.length = 0 // Clear the array after processing the batch
        }
      })

      await categoriesPromise
    }

    if (categories.length > 0) {
      await prisma.category.createMany({
        data: categories
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importUsers = async (filePath: string) => {
  const users: Pick<User, 'name' | 'email' | 'password' | 'role' | 'originalId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const userPromise = limit(async () => {
        users.push({
          name: row.name,
          email: row.email,
          password: await encryptPassword(row.password),
          role: Role.USER,
          originalId: +row.userId
        })

        if (users.length >= BATCH_SIZE) {
          await prisma.user.createMany({
            data: users
          })
          users.length = 0 // Clear the array after processing the batch
        }
      })

      await userPromise
    }

    if (users.length > 0) {
      await prisma.user.createMany({
        data: users
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importStores = async (filePath: string) => {
  const stores: Pick<Store, 'name' | 'link' | 'managerId' | 'originalId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const storePromise = limit(async () => {
        const manager = await prisma.user.create({
          data: {
            name: row.name,
            email: `store_${+row.storeId}@example.com`,
            password: await encryptPassword('Password123@'),
            role: Role.STORE_MANAGER
          }
        })

        stores.push({
          name: row.name,
          link: row.link,
          managerId: manager.id,
          originalId: +row.storeId
        })

        if (stores.length >= BATCH_SIZE) {
          await prisma.store.createMany({
            data: stores
          })
          stores.length = 0 // Clear the array after processing the batch
        }
      })

      await storePromise
    }

    if (stores.length > 0) {
      await prisma.store.createMany({
        data: stores
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importSpecifications = async (filePath: string) => {
  const specifications: Pick<Specification, 'code' | 'name' | 'value' | 'productId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const specificationPromise = limit(async () => {
        const product = await prisma.product.findFirst({
          where: {
            originalId: +row.productId
          },
          select: {
            id: true
          }
        })

        if (!product) {
          throw new ApiError(httpStatus.NOT_FOUND, `Product with originalId ${row.productId} not found`)
        }

        specifications.push({
          code: row.code,
          name: row.name,
          value: row.value,
          productId: product.id
        })

        if (specifications.length >= BATCH_SIZE) {
          await prisma.specification.createMany({
            data: specifications
          })
          specifications.length = 0 // Clear the array after processing the batch
        }
      })

      await specificationPromise
    }

    if (specifications.length > 0) {
      await prisma.specification.createMany({
        data: specifications
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importReviews = async (filePath: string) => {
  const reviews: Pick<Review, 'userId' | 'productId' | 'rating' | 'comment'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 1000
  const productIds: { originalId: string; id: string }[] = []
  const userIds: { originalId: string; id: string }[] = []
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const reviewPromise = limit(async () => {
        let productId = productIds.find((product) => product.originalId === row.productId)?.id
        let userId = userIds.find((user) => user.originalId === row.userId)?.id

        if (!productId) {
          const product = await prisma.product.findFirst({
            where: {
              originalId: +row.productId
            },
            select: {
              id: true,
              originalId: true
            }
          })

          if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, `Product with originalId ${row.productId} not found`)
          }
          productId = product.id
          productIds.push({ originalId: row.productId, id: product.id })
        }

        if (!userId) {
          const user = await prisma.user.findFirst({
            where: {
              originalId: +row.userId
            },
            select: {
              id: true,
              originalId: true
            }
          })

          if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, `User with originalId ${row.userId} not found`)
          }

          userId = user.id
          userIds.push({ originalId: row.userId, id: user.id })
        }

        if (productId && userId) {
          reviews.push({
            userId,
            productId,
            rating: +row.rating,
            comment: row.comment
          })
        }

        if (reviews.length >= BATCH_SIZE) {
          await prisma.review.createMany({
            data: reviews
          })
          reviews.length = 0 // Clear the array after processing the batch
        }
      })

      await reviewPromise
    }

    if (reviews.length > 0) {
      await prisma.review.createMany({
        data: reviews
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

const importProductAuthors = async (filePath: string) => {
  const productAuthors: Pick<ProductAuthor, 'authorId' | 'productId'>[] = []
  const limit = pLimit(5)
  const BATCH_SIZE = 100
  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser())

    for await (const row of stream) {
      const productAuthorPromise = limit(async () => {
        const product = await prisma.product.findFirst({
          where: {
            originalId: +row.productId
          },
          select: {
            id: true
          }
        })

        if (!product) {
          throw new ApiError(httpStatus.NOT_FOUND, `Product with originalId ${row.productId} not found`)
        }

        const authorIds = row.authorIds.split(';').map((id: string) => +id.trim())
        const authors = await prisma.author.findMany({
          where: {
            originalId: {
              in: authorIds
            }
          },
          select: {
            id: true,
            originalId: true
          }
        })

        authors.forEach(({ id }) => {
          productAuthors.push({
            authorId: id,
            productId: product.id
          })
        })

        if (productAuthors.length >= BATCH_SIZE) {
          await prisma.productAuthor.createMany({
            data: productAuthors
          })
          productAuthors.length = 0 // Clear the array after processing the batch
        }
      })

      await productAuthorPromise
    }

    if (productAuthors.length > 0) {
      await prisma.productAuthor.createMany({
        data: productAuthors
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error: ' + error)
  } finally {
    await fs.promises.unlink(filePath) // Ensure file is deleted after processing
  }
}

export default {
  importAuthors,
  importCategories,
  importUsers,
  importStores,
  importProducts,
  importSpecifications,
  importReviews,
  importProductAuthors
}
