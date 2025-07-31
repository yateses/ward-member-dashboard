import type { MemberImportData } from '../types/member'

export function parseClipboardData(clipboardText: string): MemberImportData[] {
  const lines = clipboardText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('Invalid data format: Need at least header and one data row')
  }

  // Parse header
  const headers = lines[0].split('\t')
  
  // Validate required headers - only require the most essential ones
  const requiredHeaders = ['PREFERRED_NAME', 'HEAD_OF_HOUSE']
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required header: ${required}`)
    }
  }

  // Parse data rows
  const data: MemberImportData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}, skipping`)
      continue
    }

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // Only add rows that have at least a name
    if (row.PREFERRED_NAME && row.PREFERRED_NAME.trim()) {
      data.push(row as MemberImportData)
    }
  }

  return data
}

export function validateImportData(data: MemberImportData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  data.forEach((row, index) => {
    // Only require the most essential fields
    if (!row.PREFERRED_NAME?.trim()) {
      errors.push(`Row ${index + 1}: Missing preferred name`)
    }
    
    if (!row.HEAD_OF_HOUSE?.trim()) {
      errors.push(`Row ${index + 1}: Missing head of house`)
    }
    
    // Make address optional - many records might not have addresses
    // if (!row.ADDRESS_STREET_1?.trim()) {
    //   errors.push(`Row ${index + 1}: Missing address`)
    // }
    
    // Make age validation more flexible - allow empty or invalid ages
    const age = parseInt(row.AGE)
    if (row.AGE && row.AGE.trim() && (isNaN(age) || age < 0 || age > 120)) {
      errors.push(`Row ${index + 1}: Invalid age: ${row.AGE}`)
    }
    
    // Make gender validation more flexible - allow empty or invalid genders
    if (row.GENDER && row.GENDER.trim() && !['M', 'F'].includes(row.GENDER)) {
      errors.push(`Row ${index + 1}: Invalid gender: ${row.GENDER}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function formatImportSummary(data: MemberImportData[]): {
  totalRecords: number
  households: number
  ageGroups: { children: number; youth: number; adults: number }
  genderBreakdown: { male: number; female: number }
} {
  const households = new Set(data.map(row => row.HEAD_OF_HOUSE))
  
  const ageGroups = {
    children: 0,
    youth: 0,
    adults: 0
  }
  
  const genderBreakdown = {
    male: 0,
    female: 0
  }
  
  data.forEach(row => {
    // Handle age more gracefully
    let age = 0
    if (row.AGE && row.AGE.trim()) {
      const parsedAge = parseInt(row.AGE)
      if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120) {
        age = parsedAge
      }
    }
    
    if (age < 18) ageGroups.children++
    else if (age < 30) ageGroups.youth++
    else ageGroups.adults++
    
    // Handle gender more gracefully
    if (row.GENDER === 'M') genderBreakdown.male++
    else if (row.GENDER === 'F') genderBreakdown.female++
    // If gender is missing or invalid, we don't count it in the breakdown
  })
  
  return {
    totalRecords: data.length,
    households: households.size,
    ageGroups,
    genderBreakdown
  }
} 