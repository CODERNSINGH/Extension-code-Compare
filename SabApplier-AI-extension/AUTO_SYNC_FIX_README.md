# Auto-Logout/Auto-Login Fix

## Problem Description

The SabApplier extension was experiencing frequent auto-logout and auto-login cycles due to aggressive JWT token synchronization between the website and the extension. This was caused by:

1. **Frequent token polling** (every 3 seconds)
2. **Overly sensitive logout detection** 
3. **Multiple token monitoring sources** running simultaneously
4. **Race conditions** during website loading or network issues

## Solution Implemented

### 1. Reduced Token Polling Frequency
- Changed from 3 seconds to 10 seconds (configurable)
- Added failure tracking to stop polling after consecutive failures
- Added debouncing to prevent rapid token updates

### 2. Conservative Logout Detection
- Only logout when explicit logout flag is set AND extension is currently authenticated
- Removed overly sensitive checks that could trigger false logouts
- Increased logout debounce time to 10 seconds

### 3. Debounced Token Monitoring
- Added 1-second debounce for localStorage/sessionStorage changes
- Added 500ms debounce for logout events
- Increased initial token check delay to 2 seconds

### 4. User-Configurable Settings
- Added settings panel in Dashboard to control auto-sync behavior
- Users can disable auto-sync entirely if preferred
- Configurable sync interval and failure limits

## New Features

### Settings Panel
Access the settings by clicking the "Settings" button in the Dashboard header.

**Available Options:**
- **Auto-sync with website**: Toggle automatic synchronization on/off
- **Sync interval**: Choose how often to check for login changes (5s, 10s, 30s, 1min)
- **Max consecutive failures**: Set how many failed attempts before stopping (1, 3, 5, 10)

### Configuration Storage
Settings are automatically saved to Chrome storage and persist across browser sessions.

## Technical Changes

### Background Script (`public/background.js`)
- Added `BackgroundJWTAuth` class with improved error handling
- Implemented failure tracking and debouncing
- Added configurable sync settings
- Reduced polling frequency from 3s to 10s

### Content Script (`public/content-script.js`)
- Added debounced token monitoring
- Increased delays for initial checks
- Improved error handling for extension context issues

### Dashboard Component (`src/components/Dashboard.jsx`)
- Added settings panel with sync configuration controls
- Integrated with background script for settings management
- Added visual feedback for settings updates

## Usage

### For Users
1. Open the SabApplier extension
2. Click the "Settings" button in the Dashboard
3. Configure auto-sync settings as needed:
   - **Disable auto-sync** if you prefer manual login/logout
   - **Increase sync interval** if you experience frequent issues
   - **Adjust failure limits** based on your network stability

### For Developers
The sync configuration can be programmatically controlled:

```javascript
// Get current config
chrome.runtime.sendMessage({ action: 'GET_SYNC_CONFIG' }, (response) => {
  console.log(response.config);
});

// Update config
chrome.runtime.sendMessage({ 
  action: 'UPDATE_SYNC_CONFIG', 
  config: { autoSync: false, pollingInterval: 30000 } 
}, (response) => {
  console.log('Config updated:', response.config);
});
```

## Benefits

1. **Reduced false logouts**: More conservative detection prevents unnecessary logout cycles
2. **Better performance**: Less frequent polling reduces resource usage
3. **User control**: Users can disable auto-sync if they prefer manual control
4. **Improved stability**: Better error handling and failure recovery
5. **Configurable**: Settings can be adjusted based on user preferences and network conditions

## Troubleshooting

If you still experience auto-logout issues:

1. **Disable auto-sync** in settings and use manual login
2. **Increase sync interval** to reduce frequency of checks
3. **Check network stability** - poor connections can cause false failures
4. **Clear extension storage** if settings become corrupted

## Migration Notes

- Existing users will have auto-sync enabled by default
- Settings are automatically saved and restored
- No data loss occurs during the update
- The extension remains backward compatible 