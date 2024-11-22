import logger from '@/configs/logger'
import { startJob as startMatrixJob } from './calculateMatrix'

/**
 * Initialize and start all cron jobs
 */
const initializeCronJobs = (): void => {
  logger.info('Initializing cron jobs...')

  const jobs = [
    startMatrixJob() // Start the matrix calculation job
  ]

  logger.info(`${jobs.length} cron jobs initialized.`)
}

export default initializeCronJobs
