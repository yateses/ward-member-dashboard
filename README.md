# FH5 Members

A Vue.js web application for managing congregation data with Firebase Firestore integration. This app allows you to import data from LCR (Leader and Clerk Resources) reports and organize your congregation information.

## Features

- 📥 **LCR Data Import**: Paste clipboard data from LCR reports to import member information
- 👥 **Member Management**: View and manage individual member records
- 🏠 **Household Organization**: Group members by households
- 📊 **Dashboard Analytics**: View congregation statistics and demographics
- 📋 **Callings Tracking**: Track member callings and responsibilities
- 🔍 **Search Functionality**: Search members by name, address, or contact information

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd congregation-manager
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database in your project
3. Go to Project Settings > General > Your apps
4. Add a web app to your project
5. Copy the Firebase configuration object

### 3. Configure Firebase

1. Open `src/firebase/config.ts`
2. Replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}
```

### 4. Firestore Security Rules

Set up Firestore security rules to allow read/write access. In the Firebase Console, go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development - customize for production
    }
  }
}
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Importing LCR Data

#### **Option A: Direct LCR Fetch (Recommended)**

1. **Save your LCR credentials** in the credentials manager
2. **Click "Fetch Data"** to automatically login and download your member data
3. **Review and import** the data

**Features:**
- 🔐 **Secure credential storage** (locally in your browser)
- 🔄 **Automatic login** to LCR
- 📊 **One-click data import**
- 🔒 **No manual copying/pasting required**

#### **Option B: Manual Paste**

1. **Get Data from LCR**:
   - Log into your LCR account
   - Run your custom report script
   - Copy the tab-separated data to your clipboard

2. **Import into App**:
   - Navigate to the Import page
   - Paste the clipboard data into the text area
   - Click "Parse Data" to validate
   - Review the import summary
   - Click "Import Data" to save to Firestore

### **Security & Privacy:**
- 🔒 **Local Storage**: Your credentials are stored locally in your browser's localStorage
- 🚫 **No Server Storage**: Credentials are never sent to or stored on any server
- 🔐 **Base64 Encoding**: Credentials are encoded (not encrypted) for basic obfuscation
- 🗑️ **Easy Removal**: You can clear credentials at any time using the "Clear Credentials" button

### **CORS Setup (if needed):**
If you encounter CORS errors, you can disable web security for local development:

**Chrome:**
```bash
chrome.exe --disable-web-security --user-data-dir=C:\temp\chrome_dev
```

**Firefox:**
1. Go to `about:config`
2. Set `security.fileuri.strict_origin_policy` to `false`

### Sample LCR Script

Use this script in your browser console when logged into LCR:

```javascript
async function getMemberList() {
    const response = await fetch('https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/YOUR-REPORT-ID?lang=eng');
    const json = await response.json();
    
    const rows = [];
    const header = [];
    for(const column of json.columns) {
        header.push(column.key);
    }
    rows.push(header);
    for(const member of json.members) {
        const row = [];
        for(const column of json.columns) {
            row.push(member[column.key]);
        }
        rows.push(row);
    }
    
    // Copy to clipboard
    const text = rows.map(row => row.join('\t')).join('\n');
    await navigator.clipboard.writeText(text);
    console.log('Data copied to clipboard');
}
```

## Data Structure

The app stores member data with the following structure:

```typescript
interface Member {
  id?: string
  preferredName: string
  headOfHouse: string
  addressStreet1: string
  age: number
  baptismDate?: string
  birthDate?: string
  callings?: string[]
  birthDay?: number
  birthMonth?: string
  birthYear?: number
  birthplace?: string
  gender: 'M' | 'F'
  individualPhone?: string
  individualEmail?: string
  marriageDate?: string
  priesthoodOffice?: string
  templeRecommendExpirationDate?: string
  createdAt: Date
  updatedAt: Date
}
```

## Development

### Project Structure

```
src/
├── components/          # Vue components
├── firebase/           # Firebase configuration
├── router/             # Vue Router configuration
├── services/           # Data services
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── views/              # Page components
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Security Considerations

- Update Firestore security rules for production use
- Implement user authentication if needed
- Consider data encryption for sensitive information
- Regularly backup your Firestore data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
