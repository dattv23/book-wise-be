import { User } from '@prisma/client'

import catchAsync from '@/utils/catchAsync'
import sendResponse from '@configs/response'
import { recommendationService } from '@/services'

const getRecommendations = catchAsync(async (req, res) => {
  const { userId } = req.user as User
  const result = await recommendationService.getDetailedRecommendations(userId)
  sendResponse.success(res, result, 'Get recommendations successfully!')
})

export default { getRecommendations }
