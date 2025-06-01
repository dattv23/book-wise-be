import cron from 'node-cron'
import recommendationService from '@/services/recommendation.service'

export class CronService {
  async startModelTrainingCron() {
    // 👉 Chạy ngay khi khởi động
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

    // 👉 Thiết lập lịch chạy mỗi ngày lúc 2h sáng
    cron.schedule('0 2 * * *', async () => {
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
