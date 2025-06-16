import cron from 'node-cron'
import recommendationService from '@/services/recommendation.service'
import sentimentService from '@/services/sentiment.service'
import { CRON_SCHEDULES } from '@/configs/schedules'

export class CronService {
  async startModelTrainingCron() {
    console.log('🧠 [Startup] Running sentiment analysis immediately...')
    try {
      await sentimentService.analyzeAllComments()
      console.log('✅ [Startup] Sentiment analysis completed successfully')
    } catch (error) {
      console.error('❌ [Startup] Error during sentiment analysis:', error)
    }

    console.log('🚀 [Startup] Running model training immediately...')
    try {
      await recommendationService.trainModel({
        algorithm: 'SVD',
        parameters: {
          n_factors: 100,
          n_epochs: 20,
          lr_all: 0.005,
          reg_all: 0.02
        }
      })
      console.log('✅ [Startup] Model training completed successfully')
    } catch (error) {
      console.error('❌ [Startup] Error during immediate model training:', error)
    }

    cron.schedule(CRON_SCHEDULES.sentiment, async () => {
      console.log('⏰ [CronJob] Starting scheduled sentiment analysis at 1:00 AM...')
      try {
        await sentimentService.analyzeAllComments()
        console.log('✅ [CronJob] Sentiment analysis completed successfully')
      } catch (error) {
        console.error('❌ [CronJob] Error during sentiment analysis:', error)
      }
    })

    cron.schedule(CRON_SCHEDULES.modelTraining, async () => {
      console.log('⏰ [CronJob] Starting scheduled model training at 2:00 AM...')
      try {
        await recommendationService.trainModel({
          algorithm: 'SVD',
          parameters: {
            n_factors: 100,
            n_epochs: 20,
            lr_all: 0.005,
            reg_all: 0.02
          }
        })
        console.log('✅ [CronJob] Model training completed successfully')
      } catch (error) {
        console.error('❌ [CronJob] Error during scheduled model training:', error)
      }
    })
  }
}
