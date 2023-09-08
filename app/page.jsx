'use client'

import { Trash } from 'lucide-react'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const revalidate = 1

export default function Home () {
  const [sheetData, setSheetData] = useState([])
  const [errors, setErrors] = useState([])
  const [selectedFileName, setSelectedFileName] = useState(null) // New state for file name
  const [previousAttempts, setPreviousAttempts] = useState([]) // New state for previous attempts

  useEffect(() => {
    // Fetch previous attempts from the server
    const fetchPreviousAttempts = async () => {
      const res = await fetch('/api/getPreviousAttempts')
      const data = await res.json()
      setPreviousAttempts(data)
    }

    fetchPreviousAttempts()
  }, [])

  const validateObject = (obj) => {
    const errors = []

    if (!obj) {
      errors.push('Object is null or undefined.')
      return { isValid: false, errors }
    }

    if (typeof obj.Client !== 'string') {
      errors.push('Client must be a string.')
    } else if (obj.Client.length > 50) {
      errors.push('Client must be have a length less than 50.')
    }
    if (typeof obj.Time !== 'number') {
      errors.push('Appointment Time must be a number.')
    } else if (obj.Time < (9 / 24) || obj.Time > (17 / 24)) {
      errors.push('Appointment Time must be between 9:00 AM and 5:00 PM.')
    }
    if (typeof obj.Link !== 'string') {
      errors.push('Link must be a string.')
    } else if (
      !(obj.Link.startsWith('http') && obj.Link.length <= 20) &&
      !(obj.Link.startsWith('www') && obj.Link.length <= 15)
    ) {
      errors.push('Link must begin with http or www, and have less than 20 or 15 characters respectively.')
    }
    if (typeof obj.Price !== 'number') {
      errors.push('Price must be a number.')
    } else if (obj.Price < 10) {
      errors.push('Price must be greater than 10.')
    }

    const isValid = errors.length === 0
    return { isValid, errors }
  }

  const uploadFile = async () => {
    console.log('Validating and reading file')
    setSheetData([])
    setErrors([])
    const fileInput = document.getElementById('fileInput')
    const file = fileInput.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    // Validate file type
    const validMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validMimeTypes.includes(file.type)) {
      setErrors(['Invalid file type'])
      console.log('Invalid file type')
      return
    }
    setErrors([])
    // Read the Excel file
    const reader = new FileReader()
    reader.onload = (e) => {
      const handleOnLoad = async () => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // Assuming the first sheet
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(ws)

        const allErrors = []

        const validationResults = jsonData.map((obj, index) => {
          const { isValid, errors } = validateObject(obj)
          if (!isValid) {
            allErrors.push(`Row ${index + 1} (excel row ${index + 2}) has errors: ${errors.join(' ')}`)
          }
          return isValid
        })

        setErrors(allErrors)

        const allValid = validationResults.every(Boolean)

        const dataToAppend = {
          data: jsonData,
          timestamp: new Date().toISOString(),
          filename: selectedFileName,
          isValid: allValid,
          errors: allErrors
        }

        const res = await fetch('/api/writeToFile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToAppend)
        })

        const result = await res.json()
        console.log('API response:', result)

        if (allValid) {
          setSheetData(jsonData)
          console.log('Excel data:', jsonData)
        } else {
          console.log('Some rows have invalid data format')
        }
      }

      handleOnLoad()
    }
    reader.readAsBinaryString(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name) // Update the file name state
    }
    setErrors([])
    setSheetData([])
  }

  const loadFile = (attempt) => {
    const data = []
    for (const key in attempt) {
      // Check if the key is a number (or can be converted to one)
      if (!isNaN(Number(key))) {
        data.push(attempt[key])
      }
    }
    setSheetData(data)
    setSelectedFileName(attempt.filename)
    setErrors(attempt.errors)
  }

  const deleteData = async () => {
    const res = await fetch('/api/deleteData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const result = await res.json()
    console.log('API response:', result)
  }

  return (
    <main className='flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8 text-white'>
      <div className='text-center m-8 p-2'>
        <h1 className='text-3xl font-bold mb-6'>Excel File Validator</h1>
        <a href='/example.xlsx' download className='bg-green-600 text-white p-2 rounded hover:bg-green-700 m-4 scale-100 hover:scale-110 transition ease-in-out'>
          Download Example File
        </a>
      </div>
      <div className='flex flex-row w-2/3 justify-center items-start'>
        <div className='w-1/3 mr-8'>
          <h2 className='text-2xl font-bold mb-2 flex flex-row items-center justify-between'>
            Previous Attempts
            <div onClick={deleteData} className='bg-red-600 rounded-md w-8 h-8 flex items-center justify-center cursor-pointer'>
              <Trash size={20} />
            </div>
          </h2>
          <ul>
            {previousAttempts.map((attempt, index) => (
              <li onClick={() => loadFile(attempt)} key={index} className={(attempt.isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700') + ' border-2 border-gray-900 rounded-md cursor-pointer p-2 scale-100 hover:scale-105 transition ease-in-out'}>
                {attempt.filename} - {new Date(attempt.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
        <div className='bg-gray-800 p-8 rounded-lg shadow-md w-2/3'>
          <form id='uploadForm' className='flex flex-col space-y-4'>
            <label className='bg-gray-800 text-white p-2 rounded border border-white text-center cursor-pointer scale-100 hover:scale-105 transition ease-in-out'>
              Choose File
              <input type='file' id='fileInput' name='fileInput' className='hidden' onChange={handleFileChange} />
            </label>
            {selectedFileName && <p>Selected File: {selectedFileName}</p>}
            <button type='button' onClick={uploadFile} className='bg-blue-600 text-white p-2 rounded hover:bg-blue-700 scale-100 hover:scale-105 transition ease-in-out'>
              Upload
            </button>
          </form>
          <div className='mt-8'>
            <h2 className={errors.length > 0 ? 'text-red-500' : 'hidden'}>Errors:</h2>
            <ul className={errors.length > 0 ? 'list-disc pl-5 text-red-500' : 'hidden'}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <h2 className={sheetData.length === 0 ? 'hidden' : 'text-green-500 mt-4'}>Data is valid:</h2>
            <pre className={sheetData.length === 0 ? 'hidden' : 'bg-gray-700 p-4 rounded mt-2'}>
              {JSON.stringify(sheetData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </main>
  )
}
