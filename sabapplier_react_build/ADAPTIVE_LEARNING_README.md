# Adaptive Learning Feature

## Overview

The Adaptive Learning feature automatically detects when users modify autofilled form data and offers them the option to save these changes to improve future autofill accuracy.

## How It Works

### 1. Data Tracking
- When forms are autofilled, the extension stores the original values
- The content script monitors all form field changes in real-time
- Changes are detected when users modify autofilled fields

### 2. Change Detection
- Triggers on form submission, button clicks (submit, next, continue, etc.)
- Triggers on page navigation
- Triggers on individual field changes (with debouncing)

### 3. User Notification
- Shows a browser notification when changes are detected
- Displays a modal in the extension with change details
- Users can review original vs. new values
- Users can choose to save or ignore changes

## Components

### Content Script (`content-script.js`)
- Tracks autofilled data using `originalAutofilledValues` Map
- Detects changes with `checkForAdaptiveLearningChanges()`
- Sends adaptive learning data to background script

### Background Script (`background.js`)
- Handles `adaptiveLearningData` messages
- Stores adaptive learning data
- Shows browser notifications
- Manages data persistence

### AdaptiveLearningNotification Component
- Modal interface for reviewing changes
- Shows original vs. new values side-by-side
- Handles save/ignore actions
- Integrates with LearningAPI

### DataPreview Component
- Checks for adaptive learning data
- Shows adaptive learning notification when data is available
- Integrates with existing data preview functionality

## API Integration

### New API Functions
- `saveAdaptiveLearningData()` - Saves changed data to backend
- `getAdaptiveLearningData()` - Retrieves adaptive learning data
- `toggleAdaptiveLearning()` - Enables/disables the feature

### Data Format
```javascript
{
  selector: "#email",
  originalValue: "user@example.com",
  currentValue: "newuser@example.com",
  type: "email",
  timestamp: 1234567890
}
```

## User Experience

### 1. Form Autofill
- User fills a form using autofill
- Extension stores original values

### 2. User Modifies Data
- User changes autofilled values
- Extension detects changes

### 3. Notification
- Browser notification appears
- Extension modal shows change details

### 4. User Choice
- User can save changes (improves future autofill)
- User can ignore changes (keeps original data)

## Configuration

### Enable/Disable
- Feature is enabled by default
- Can be toggled via API or extension settings

### Notification Settings
- Browser notifications require permission
- Modal notifications work without browser permission

## Technical Details

### Performance
- Debounced change detection (500ms)
- Efficient data storage and retrieval
- Minimal impact on form performance

### Security
- Data is stored locally until user chooses to save
- No data sent to backend without user consent
- Secure API communication

### Compatibility
- Works with all form field types
- Supports dynamic form content
- Compatible with SPA navigation

## Future Enhancements

1. **Smart Suggestions** - Suggest common variations
2. **Batch Processing** - Handle multiple changes at once
3. **Learning Analytics** - Track improvement over time
4. **Custom Rules** - User-defined change patterns
5. **Integration** - Connect with other learning systems

## Troubleshooting

### Common Issues
1. **Notifications not showing** - Check browser permissions
2. **Changes not detected** - Verify content script injection
3. **Data not saving** - Check API connectivity

### Debug Mode
- Enable console logging for detailed debugging
- Check background script console for errors
- Verify content script is running on target pages 