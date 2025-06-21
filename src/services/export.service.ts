import fs from 'fs'

import prisma from '@/client'
import appDir from '@/helpers/pathHelper'
import { createObjectCsvWriter } from 'csv-writer'

const exportReviews = async (filter: object): Promise<string> => {
  const reviews = await prisma.review.findMany({
    where: filter,
    select: {
      id: true,
      rating: true,
      comment: true,
      sentiment: true,
      isValid: true,
      userId: true,
      productId: true,
      createdAt: true,
      updatedAt: true
    }
  })
  const dir = appDir + 'static/exports'

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const filePath = `${dir}/${process.hrtime.bigint()}-reviews.csv`
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'rating', title: 'Rating' },
      { id: 'comment', title: 'Comment' },
      { id: 'sentiment', title: 'Sentiment' },
      { id: 'isValid', title: 'IsValid' },
      { id: 'userId', title: 'UserID' },
      { id: 'productId', title: 'ProductID' }
    ]
  })
  await csvWriter.writeRecords(reviews)
  return filePath
}

export default {
  exportReviews
}
