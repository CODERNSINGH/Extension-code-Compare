# SabApplier AI React Extension

A React-based Chrome extension for intelligent form automation and data management.

## Features

### 🎯 **Simplified Dashboard**
- **AutoFill Button**: Single-click form filling using your saved data
- **Unfilled Fields Display**: Shows fields that couldn't be filled automatically with copy options
- **File Download**: Direct download for file fields (Aadhaar, PAN, etc.)

### 🔄 **Automatic Data Capture**
- **No Popups**: Data is captured automatically without interrupting your workflow
- **Smart Detection**: Captures data when you click submit, next, continue, save, or proceed buttons
- **Real-time Preview**: Captured data appears automatically in the extension sidebar

### 📊 **Data Management**
- **View Learned Data**: Organized by website with expandable sections
- **Copy & Download**: Easy access to saved information
- **Add Custom Data**: Manually add form fields and values

### 🎨 **Modern UI**
- **Fixed Header**: SabApplier AI branding in center, navigation on left, user profile on right
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all screen sizes
- **Consistent Design Language**: Unified styling throughout

## How It Works

### 1. **AutoFill Process**
1. Click the "AutoFill Forms" button on any webpage with forms
2. The extension analyzes the form structure and matches it with your saved data
3. Fields are automatically filled
4. Unfilled fields are displayed with copy options for manual filling

### 2. **Data Capture**
1. Fill out forms normally on any website
2. When you click submit/next/continue buttons, data is automatically captured
3. The extension sidebar shows a preview of captured data
4. Choose to save or skip the data

### 3. **Data Management**
1. Navigate to "View Learned Data" to see all saved information
2. Data is organized by website domain
3. Copy values or download files as needed
4. Add custom data manually if needed

## File Structure

```
src/
├── components/
│   ├── Header.jsx          # Fixed header with navigation and user profile
│   ├── Dashboard.jsx       # Main dashboard with AutoFill button
│   ├── YourDetails.jsx     # Learned data management
│   ├── DataPreview.jsx     # Automatic data preview in sidebar
│   ├── FilledDetails.jsx   # Display of filled form results
│   ├── Login.jsx          # User authentication
│   └── Loader.jsx         # Loading states
├── services/API/
│   ├── EmailLogin.js       # AutoFill functionality (unchanged)
│   ├── LoginFunction.js    # Authentication
│   └── getAuthToken.js     # Token management
└── App.js                  # Main app with routing

public/
├── content-script.js       # Automatic form data capture
├── background.js          # Background script for data management
└── manifest.json          # Extension configuration
```

## Key Changes Made

### ✅ **Header Redesign**
- SabApplier AI branding moved to center
- Navigation buttons on left (Dashboard, View Learned Data)
- User profile and theme toggle on right
- Welcome message with username

### ✅ **Dashboard Simplification**
- Single prominent AutoFill button
- Removed complex action cards
- Shows unfilled fields with copy options
- File download functionality for document fields

### ✅ **Automatic Data Capture**
- Content script captures data on form submission
- No popups or manual intervention required
- Data preview appears automatically in sidebar
- Save or skip options for captured data

### ✅ **Improved Data Management**
- Cleaner website grouping
- Better field organization
- Copy and download functionality
- Simplified add data modal

## Usage Instructions

1. **Install the Extension**: Load the extension in Chrome developer mode
2. **Login**: Use your SabApplier account credentials
3. **AutoFill**: Click the AutoFill button on any form page
4. **Data Capture**: Fill forms normally - data is captured automatically
5. **Manage Data**: Use "View Learned Data" to organize your information

## Technical Notes

- **EmailLogin.js**: Unchanged - handles the core AutoFill functionality
- **fetch_autofill_data.py**: Unchanged - backend AI processing
- **Content Script**: Automatically captures form data without popups
- **Background Script**: Manages communication between content script and extension
- **Sidebar Integration**: Data preview appears automatically when data is captured

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The extension is now simplified, more user-friendly, and provides automatic data capture without interrupting the user's workflow.
