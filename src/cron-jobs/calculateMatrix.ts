import config from '@/configs/config'
import logger from '@/configs/logger'
import { spawn } from 'child_process'
import path from 'path'
import cron from 'node-cron'

const PYTHON_SCRIPT_PATH = path.join(__dirname, '../scripts/calculate_matrix.py')

/**
 * Execute matrix calculation using Python script
 */
const calculateMatrix = () => {
  const startTime = Date.now()
  logger.info('Starting matrix calculation...')

  const python = spawn('python', [PYTHON_SCRIPT_PATH, config.database.mongoUri, config.database.databaseName])

  python.stdout.on('data', (data) => {
    logger.info(`Python script output: ${data}`)
  })

  python.stderr.on('data', (data) => {
    logger.error(`Python script error: ${data}`)
  })

  python.on('close', (code) => {
    const duration = (Date.now() - startTime) / 1000
    if (code === 0) {
      logger.info(`Matrix calculation completed successfully in ${duration}s`)
    } else {
      logger.error(`Matrix calculation failed with code ${code}`)
    }
  })

  return python
}

/**
 * Start cron job with given schedule
 * @param {string} schedule - Cron schedule expression
 */
const startJob = (schedule = config.cron.matrixCalculation) => {
  logger.info(`Starting matrix calculation cron job with schedule: ${schedule}`)

  return cron.schedule(schedule, calculateMatrix, {
    timezone: config.cron.timezone
  })
}

export { startJob }
