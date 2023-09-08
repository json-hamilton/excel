// Inside your API route (e.g., /api/writeToFile.js)

import fs from 'fs'
import path from 'path'

export default async (req, res) => {
  const { data, isValid, errors, filename } = req.body

  // Add a timestamp and additional fields to the data
  const timestamp = new Date().toISOString()
  const newData = { ...data, timestamp, filename, isValid, errors }

  // Read existing data from the JSON file
  const filePath = path.resolve('./data.json')
  let existingData = []

  if (fs.existsSync(filePath)) {
    const rawContent = fs.readFileSync(filePath, 'utf-8')
    try {
      existingData = JSON.parse(rawContent)
    } catch (e) {
      console.error('Error parsing JSON:', e)
      existingData = []
    }
  }

  // Check if existingData is an array
  if (!Array.isArray(existingData)) {
    console.error('existingData is not an array:', existingData)
    existingData = []
  }

  // Append new data to existing data
  existingData.push(newData)

  // Write the updated data back to the JSON file
  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2))

  res.status(200).json({ message: 'Data successfully appended to file' })
}
