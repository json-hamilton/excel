// Inside your API route (e.g., /api/writeToFile.js)

import fs from 'fs'
import path from 'path'

export default async (req, res) => {
  const emptyData = []

  // Convert empty data to JSON string
  const jsonEmptyData = JSON.stringify(emptyData, null, 2)
  // Write the updated data back to the JSON file
  fs.writeFileSync('./data.json', jsonEmptyData)

  res.status(200).json({ message: 'Data successfully appended to file' })
}
