import type { MemberImportData } from '../types/member'

export interface LCRAutomationResult {
  success: boolean
  data?: MemberImportData[]
  error?: string
  files?: {
    jsonFile: string
    tsvFile: string
  }
}

export interface OneClickResult {
  success: boolean
  message: string
  data?: MemberImportData[]
  memberCount?: number
}

export class LCRAutomationService {
  private static readonly API_ENDPOINT = '/api/fetch-lcr-data'

  /**
   * Trigger LCR data fetch using the Puppeteer automation
   */
  static async fetchMemberData(): Promise<LCRAutomationResult> {
    try {
      console.log('🚀 Triggering LCR automation...')
      
      // In development, we'll call the script directly
      // In production, this would call a backend API
      if (import.meta.env.DEV) {
        return await this.fetchDataInDevelopment()
      } else {
        return await this.fetchDataInProduction()
      }
      
    } catch (error) {
      console.error('❌ LCR automation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Development mode: Call the Node.js script directly
   */
  private static async fetchDataInDevelopment(): Promise<LCRAutomationResult> {
    try {
      // For development, we'll simulate the process
      // In a real implementation, you'd need a backend API
      console.log('📝 Development mode: Please run "npm run fetch-lcr" manually')
      
      return {
        success: false,
        error: 'In development mode, please run "npm run fetch-lcr" manually to fetch LCR data, then import the generated file.'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Development fetch failed'
      }
    }
  }

  /**
   * Production mode: Call backend API
   */
  private static async fetchDataInProduction(): Promise<LCRAutomationResult> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Production fetch failed'
      }
    }
  }

  /**
   * Import data from a local file (for development)
   */
  static async importFromFile(filePath: string): Promise<LCRAutomationResult> {
    try {
      console.log(`📁 Importing data from: ${filePath}`)
      
      // In a real implementation, you'd read the file here
      // For now, we'll return a placeholder
      return {
        success: false,
        error: 'File import not implemented in frontend. Please use the manual import feature.'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File import failed'
      }
    }
  }

  /**
   * Convert LCR JSON data to MemberImportData format
   */
  static convertLCRDataToImportFormat(lcrData: any): MemberImportData[] {
    if (!lcrData.columns || !lcrData.members) {
      throw new Error('Invalid LCR data format')
    }

    return lcrData.members.map((member: any) => {
      const row: any = {}
      
      // Map the API response to our expected format
      lcrData.columns.forEach((column: any) => {
        row[column.key] = member[column.key] || ''
      })
      
      return row as MemberImportData
    })
  }

  /**
   * Check if automation is available
   */
  static isAutomationAvailable(): boolean {
    // Check if we're in development mode and have the script
    if (import.meta.env.DEV) {
      return true // Script should be available
    }
    
    // In production, check if backend API is available
    return true // Assume available for now
  }

  /**
   * Get automation status
   */
  static async getStatus(): Promise<{
    available: boolean
    lastRun?: Date
    lastSuccess?: boolean
  }> {
    return {
      available: this.isAutomationAvailable(),
      lastRun: undefined,
      lastSuccess: undefined
    }
  }

  /**
   * One-click automation: Run the script and return the data directly
   */
  static async runOneClickAutomation(): Promise<OneClickResult> {
    try {
      console.log('🚀 Starting one-click LCR automation...')
      
      // Call the API server to run the automation
      const response = await fetch('http://localhost:3001/api/run-lcr-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        // Convert the LCR data to our format
        const memberData = this.convertLCRDataToImportFormat(result.data)
        
        return {
          success: true,
          message: result.message,
          data: memberData,
          memberCount: result.memberCount
        }
      } else {
        return {
          success: false,
          message: result.message || 'Automation failed'
        }
      }
      
    } catch (error) {
      console.error('❌ One-click automation failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
} 