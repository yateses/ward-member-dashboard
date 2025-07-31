import type { MemberImportData } from '../types/member'

export class LCRService {
  // Fetch member data from LCR using popup
  static async fetchMemberData(reportId: string = '270dd333-769f-43a0-b73e-d27cc6d5d730'): Promise<MemberImportData[]> {
    return new Promise((resolve, reject) => {
      // Check if we have a popup window open
      const popup = window.open('', 'LCR_Login')
      
      if (!popup || popup.closed) {
        reject(new Error('No LCR popup window found. Please login to LCR first.'))
        return
      }
      
      // Set up message listener for data response
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'LCR_DATA_FETCHED') {
          window.removeEventListener('message', messageHandler)
          
          try {
            const json = event.data.data
            
            if (!json.members || !Array.isArray(json.members)) {
              reject(new Error('No member data found in the response'))
              return
            }

            // Convert the JSON data to our MemberImportData format
            const memberData: MemberImportData[] = []
            
            for (const member of json.members) {
              const row: any = {}
              
              // Map the API response to our expected format
              if (json.columns) {
                for (const column of json.columns) {
                  row[column.key] = member[column.key] || ''
                }
              } else {
                // Fallback mapping for common fields
                row.PREFERRED_NAME = member.preferredName || member.PREFERRED_NAME || ''
                row.HEAD_OF_HOUSE = member.headOfHouse || member.HEAD_OF_HOUSE || ''
                row.ADDRESS_STREET_1 = member.addressStreet1 || member.ADDRESS_STREET_1 || ''
                row.AGE = member.age || member.AGE || ''
                row.BAPTISM_DATE = member.baptismDate || member.BAPTISM_DATE || ''
                row.BIRTH_DATE = member.birthDate || member.BIRTH_DATE || ''
                row.CALLINGS = member.callings || member.CALLINGS || ''
                row.BIRTH_DAY = member.birthDay || member.BIRTH_DAY || ''
                row.BIRTH_MONTH = member.birthMonth || member.BIRTH_MONTH || ''
                row.BIRTH_YEAR = member.birthYear || member.BIRTH_YEAR || ''
                row.BIRTHPLACE = member.birthplace || member.BIRTHPLACE || ''
                row.GENDER = member.gender || member.GENDER || ''
                row.INDIVIDUAL_PHONE = member.individualPhone || member.INDIVIDUAL_PHONE || ''
                row.INDIVIDUAL_EMAIL = member.individualEmail || member.INDIVIDUAL_EMAIL || ''
                row.MARRIAGE_DATE = member.marriageDate || member.MARRIAGE_DATE || ''
                row.PRIESTHOOD_OFFICE = member.priesthoodOffice || member.PRIESTHOOD_OFFICE || ''
                row.TEMPLE_RECOMMEND_EXPIRATION_DATE = member.templeRecommendExpirationDate || member.TEMPLE_RECOMMEND_EXPIRATION_DATE || ''
              }
              
              memberData.push(row as MemberImportData)
            }

            resolve(memberData)
          } catch (error) {
            reject(new Error(`Failed to process LCR data: ${error}`))
          }
        } else if (event.data && event.data.type === 'LCR_DATA_ERROR') {
          window.removeEventListener('message', messageHandler)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', messageHandler)
      
      // Call the fetch function in the popup
      try {
        popup.postMessage({
          type: 'FETCH_LCR_DATA',
          reportId,
          timestamp: Date.now()
        }, '*')
        
        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler)
          reject(new Error('Data fetch timeout'))
        }, 30000)
      } catch (error) {
        window.removeEventListener('message', messageHandler)
        reject(error)
      }
    })
  }

  // Check if user is logged into LCR (simplified - no direct calls)
  static async checkLCRLogin(): Promise<boolean> {
    // Just check if we have a session stored
    const hasSession = localStorage.getItem('lcr_session') === 'true'
    return hasSession
  }

  // Get available reports (if possible)
  static async getAvailableReports(): Promise<Array<{ id: string; name: string }>> {
    try {
      // This is a placeholder - LCR might not expose this endpoint
      // You can customize this based on your specific report IDs
      return [
        { id: '270dd333-769f-43a0-b73e-d27cc6d5d730', name: 'Member Report' }
      ]
    } catch (error) {
      console.error('Error getting reports:', error)
      return []
    }
  }
} 