import _ from 'lodash'
import path from 'path'
import { Request, Response } from 'express-serve-static-core'

import { TQueryReviews } from '@/validations/review.validation'
import { exportService } from '@/services'

const exportReviews = async (req: Request, res: Response) => {
  try {
    const query: TQueryReviews = req.query
    const filter = _.pick(query, ['productId', 'userId', 'isValid', 'sentiment'])
    const filePath = await exportService.exportReviews(filter)

    return res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error('Error sending file:', err)
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to send file.' })
        }
      }
    })
  } catch (err) {
    console.error('Export error:', err)
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export default { exportReviews }
