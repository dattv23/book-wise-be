import { PrismaClient } from '@prisma/client'
import { PythonShell } from 'python-shell'
import path from 'path'
import fs from 'fs/promises'
import config from '@/configs/config'

const prisma = new PrismaClient()
const pythonScriptPath = path.join(__dirname, '../scripts')

const analyzeAllComments = async (): Promise<number> => {
  const reviews = await prisma.review.findMany({
    where: {
      isDeleted: false,
      comment: { not: '' },
      sentiment: null
    },
    select: {
      id: true,
      comment: true,
      rating: true
    }
  })

  if (reviews.length === 0) return 0

  const tempPath = path.join(pythonScriptPath, 'temp_comments.csv')
  const header = 'id,comment\n'
  const csv = reviews.map((r) => `"${r.id}","${r.comment?.replace(/"/g, '""')}"`).join('\n')
  await fs.writeFile(tempPath, header + csv, 'utf-8')

  const pythonOptions = {
    mode: 'json' as const,
    pythonPath: config.python.path,
    scriptPath: pythonScriptPath,
    args: ['--mode', 'batch_predict', '--file', tempPath]
  }

  try {
    const results = await PythonShell.run('sentiment_engine.py', pythonOptions)
    const predictions: { id: string; label: string }[] = results[0]

    const idToPrediction = new Map(predictions.map((p) => [p.id, p.label]))

    for (const review of reviews) {
      const predictedLabel = idToPrediction.get(review.id)
      if (!predictedLabel) continue

      const rating = review.rating ?? 0

      let isInvalid = true
      if (predictedLabel === 'pos' && rating <= 2) {
        isInvalid = false
      }
      if (predictedLabel === 'neg' && rating >= 4) {
        isInvalid = false
      }

      await prisma.review.update({
        where: { id: review.id },
        data: {
          sentiment: predictedLabel,
          isValid: isInvalid
        }
      })
    }

    return predictions.length
  } catch (error) {
    console.error('❌ Error during sentiment batch prediction:', error)
    return 0
  } finally {
    await fs.unlink(tempPath).catch(() => null)
  }
}

const predictCommentSentiment = async (text: string): Promise<string> => {
  const pythonOptions = {
    mode: 'json' as const,
    pythonPath: config.python.path,
    scriptPath: pythonScriptPath,
    args: ['--mode', 'predict', '--comment', text]
  }

  try {
    const results = await PythonShell.run('sentiment_engine.py', pythonOptions)
    const prediction = results[0] as { comment: string; predicted_label: string }
    return prediction.predicted_label
  } catch (error) {
    console.error('❌ Error predicting sentiment:', error)
    return 'neutral'
  }
}

export default {
  analyzeAllComments,
  predictCommentSentiment
}
