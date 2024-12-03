import prisma from '@/client'
import config from '@/configs/config'
import { spawnSync } from 'child_process'
import path from 'path'

interface RecommendationResult {
  recommendedBookIds: string[]
}

const generateRecommendations = (userId: string): RecommendationResult => {
  try {
    const scriptPath = path.join(__dirname, '../scripts/get_recommendations.py')
    const mongoUri = config.database.mongoUri
    const databaseName = config.database.databaseName

    const result = spawnSync('python', [scriptPath, mongoUri, databaseName, userId], {
      encoding: 'utf-8'
    })

    // Check for errors
    if (result.status !== 0) {
      throw new Error(`Python script failed: ${result.stderr}`)
    }

    // Parse recommendations
    const recommendations: RecommendationResult = JSON.parse(result.stdout)

    return recommendations
  } catch (error) {
    console.error('Recommendation generation error:', error)
    throw error
  }
}

const getDetailedRecommendations = async (userId: string) => {
  try {
    const { recommendedBookIds } = generateRecommendations(userId)

    if (recommendedBookIds.length == 0) return []

    const bookDetails = await prisma.book.findMany({
      where: {
        bookId: { in: recommendedBookIds }
      },
      select: {
        bookId: true,
        info: true,
        description: true,
        details: true
      }
    })

    return bookDetails
  } catch (error) {
    console.error('Recommendation generation error:', error)
    throw error
  }
}

export default { generateRecommendations, getDetailedRecommendations }
