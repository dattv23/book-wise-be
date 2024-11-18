import fs from 'fs'

const deleteLocalFile = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    console.error('Error deleting local file:', error)
  }
}

export default deleteLocalFile
