// Inside /api/getPreviousAttempts.js

import fs from 'fs'
import path from 'path'

export default (req, res) => {
  const filePath = path.resolve('./data.json')
  let existingData = []

  if (fs.existsSync(filePath)) {
    const rawContent = fs.readFileSync(filePath, 'utf-8')
    try {
      existingData = JSON.parse(rawContent)
    } catch (e) {
      console.error('Error parsing JSON:', e)
    }
  }

  res.status(200).json(existingData)
}
