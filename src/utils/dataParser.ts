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

/** Normalize LCR cell values that include column name prefix (e.g. "Age19" -> "19", "GenderM" -> "M"). */
function normalizeLCRValue(key: keyof MemberImportData, value: string | undefined): string {
  const v = (value ?? '').trim()
  if (key === 'AGE') return v.replace(/^Age\s*/i, '').trim()
  if (key === 'GENDER') {
    const after = v.replace(/^Gender\s*/i, '').trim()
    const c = (after[0] ?? '').toUpperCase()
    return c === 'M' || c === 'F' ? c : after
  }
  return v
}

export function validateImportData(data: MemberImportData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  data.forEach((row, index) => {
    // Require preferred name; empty head of house is allowed (import uses PREFERRED_NAME as fallback)
    if (!row.PREFERRED_NAME?.trim()) {
      errors.push(`Row ${index + 1}: Missing preferred name`)
    }
    
    // Make address optional - many records might not have addresses
    // if (!row.ADDRESS_STREET_1?.trim()) {
    //   errors.push(`Row ${index + 1}: Missing address`)
    // }
    
    // Normalize LCR-prefixed values before validation
    const ageStr = normalizeLCRValue('AGE', row.AGE)
    const genderStr = normalizeLCRValue('GENDER', row.GENDER)
    const age = parseInt(ageStr)
    if (row.AGE && row.AGE.trim() && (isNaN(age) || age < 0 || age > 120)) {
      errors.push(`Row ${index + 1}: Invalid age: ${row.AGE}`)
    }
    if (row.GENDER && row.GENDER.trim() && !['M', 'F'].includes(genderStr)) {
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
    const ageStr = normalizeLCRValue('AGE', row.AGE)
    const genderStr = normalizeLCRValue('GENDER', row.GENDER)
    let age = 0
    if (ageStr) {
      const parsedAge = parseInt(ageStr)
      if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120) {
        age = parsedAge
      }
    }
    
    if (age < 18) ageGroups.children++
    else if (age < 30) ageGroups.youth++
    else ageGroups.adults++
    
    if (genderStr === 'M') genderBreakdown.male++
    else if (genderStr === 'F') genderBreakdown.female++
  })
  
  return {
    totalRecords: data.length,
    households: households.size,
    ageGroups,
    genderBreakdown
  }
} 