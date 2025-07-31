export interface LCRCredentials {
  username: string
  password: string
  loginUrl?: string // Optional custom login URL
}

export class LCRAuthService {
  private static readonly CREDENTIALS_KEY = 'lcr_credentials'
  private static readonly SESSION_KEY = 'lcr_session'

  // Store credentials locally (encrypted in production)
  static saveCredentials(credentials: LCRCredentials): void {
    try {
      // For personal use, we'll store as base64 (not secure but simple)
      // In production, you'd want proper encryption
      const encoded = btoa(JSON.stringify(credentials))
      localStorage.setItem(this.CREDENTIALS_KEY, encoded)
    } catch (error) {
      console.error('Failed to save credentials:', error)
      throw new Error('Failed to save credentials')
    }
  }

  // Get stored credentials
  static getCredentials(): LCRCredentials | null {
    try {
      const encoded = localStorage.getItem(this.CREDENTIALS_KEY)
      if (!encoded) return null
      
      const decoded = atob(encoded)
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to get credentials:', error)
      return null
    }
  }

  // Clear stored credentials
  static clearCredentials(): void {
    localStorage.removeItem(this.CREDENTIALS_KEY)
    localStorage.removeItem(this.SESSION_KEY)
  }

  // Check if we have stored credentials
  static hasCredentials(): boolean {
    return this.getCredentials() !== null
  }

  // Open LCR login in popup window
  static openLCRLoginPopup(): Promise<boolean> {
    return new Promise((resolve) => {
      // Open our login helper page
      const popup = window.open(
        '/lcr-login.html',
        'LCR_Login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        resolve(false)
        return
      }

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'LCR_LOGIN_SUCCESS') {
          window.removeEventListener('message', messageHandler)
          clearInterval(checkInterval)
          if (!popup.closed) {
            popup.close()
          }
          localStorage.setItem(this.SESSION_KEY, 'true')
          resolve(true)
        }
      }

      window.addEventListener('message', messageHandler)

      // Check if user is logged in every 2 seconds (fallback)
      const checkInterval = setInterval(async () => {
        try {
          // Check if popup is closed
          if (popup.closed) {
            clearInterval(checkInterval)
            window.removeEventListener('message', messageHandler)
            resolve(false)
            return
          }

          // Note: We're not checking login status from main window anymore
          // The popup will handle all LCR communication to avoid CORS issues
        } catch (error) {
          console.log('Checking login status...', error)
        }
      }, 2000)

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        window.removeEventListener('message', messageHandler)
        if (!popup.closed) {
          popup.close()
        }
        resolve(false)
      }, 300000) // 5 minutes
    })
  }

  // Generate a random nonce for OAuth2
  private static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Generate a code challenge for PKCE
  private static generateCodeChallenge(): string {
    const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    // In a real implementation, you'd hash this with SHA256 and base64url encode it
    // For simplicity, we'll use a placeholder
    return codeVerifier
  }

  // Check if currently logged in (simplified - no direct LCR calls)
  static async checkLoginStatus(): Promise<boolean> {
    // Just check if we have a session stored
    const hasSession = localStorage.getItem(this.SESSION_KEY) === 'true'
    return hasSession
  }

  // Auto-login if credentials are stored (simplified)
  static async autoLogin(): Promise<boolean> {
    // Just check if we have a session stored
    return this.checkLoginStatus()
  }

  // Logout from LCR (simplified - no direct calls)
  static async logout(): Promise<void> {
    // Just clear the local session
    localStorage.removeItem(this.SESSION_KEY)
  }
} 