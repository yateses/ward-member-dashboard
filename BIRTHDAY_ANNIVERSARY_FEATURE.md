# 🎉 Birthday & Anniversary Tracker Feature

## Overview
The Birthday & Anniversary Tracker is a new feature added to the main dashboard that helps you keep track of birthdays and anniversaries for your congregation members.

## Features

### 🎂 Birthday Tracking
- **This Month's Birthdays**: Shows all birthdays occurring in the current month
- **Checkbox System**: Click checkboxes to mark birthdays as "wished"
- **Member Details**: Displays name, age, date, and household information
- **Progress Tracking**: Shows completed vs. total birthdays for the month

### 💒 Anniversary Tracking
- **This Month's Anniversaries**: Shows all wedding anniversaries in the current month
- **Checkbox System**: Click checkboxes to mark anniversaries as "celebrated"
- **Anniversary Years**: Calculates and displays how many years of marriage
- **Progress Tracking**: Shows completed vs. total anniversaries for the month

### 📅 Upcoming Events
- **Next 30 Days**: Shows birthdays and anniversaries coming up in the next 30 days
- **Days Until**: Displays how many days until each event
- **Sorted by Date**: Events are sorted by how soon they're coming up

### 📊 Dashboard Stats
- **Birthday Count**: Shows total birthdays this month in the stats cards
- **Anniversary Count**: Shows total anniversaries this month in the stats cards

## How It Works

### Data Source
The tracker uses the following member data fields:
- `birthDate`: Full birth date (e.g., "1990-05-15")
- `marriageDate`: Full marriage date (e.g., "2015-08-20")
- `preferredName`: Member's name
- `age`: Current age
- `headOfHouse`: Household information

### Local Storage
- **Persistent Tracking**: Your checkbox selections are saved in browser localStorage
- **Monthly Reset**: Completed events are automatically cleared at the start of each month
- **Cross-Session**: Your progress is maintained even if you close and reopen the browser

### Smart Date Handling
- **Current Month**: Shows events happening in the current calendar month
- **Upcoming 30 Days**: Calculates the next occurrence of each birthday/anniversary
- **Year Rollover**: Handles birthdays/anniversaries that have already passed this year

## Usage

### Marking Events as Complete
1. **Find the Event**: Look for the birthday or anniversary in the list
2. **Click the Checkbox**: Click the checkbox next to the member's name
3. **Visual Feedback**: The item will turn green and become slightly transparent
4. **Progress Update**: The summary counters will update automatically

### Understanding the Display
- **🎂 Birthday Icon**: Indicates a birthday event
- **💒 Anniversary Icon**: Indicates a wedding anniversary
- **📅 Upcoming Icon**: Shows events coming up in the next 30 days
- **Green Background**: Indicates completed events
- **Yellow Background**: Indicates upcoming events (next 30 days)

### Summary Section
The summary shows:
- **Birthdays**: X/Y completed (where X = completed, Y = total this month)
- **Anniversaries**: X/Y completed
- **Next 30 Days**: Total upcoming events

## Technical Details

### Component Location
- **Main Component**: `src/components/BirthdayAnniversaryTracker.vue`
- **Dashboard Integration**: `src/views/DashboardView.vue`

### Data Flow
1. **Member Store**: Gets member data from the Pinia store
2. **Date Filtering**: Filters members by birth/marriage dates
3. **Local Storage**: Saves/loads completion status
4. **Reactive Updates**: Automatically updates when data changes

### Browser Compatibility
- **LocalStorage**: Uses browser localStorage for persistence
- **Date Handling**: Uses native JavaScript Date objects
- **Responsive Design**: Works on desktop and mobile devices

## Future Enhancements

Potential improvements for future versions:
- **Email Notifications**: Send reminders for upcoming events
- **Custom Date Ranges**: Allow viewing different time periods
- **Export Reports**: Generate reports of completed events
- **Team Sharing**: Share completion status with other leaders
- **Historical Tracking**: Keep records of past months' completions
- **Custom Messages**: Add personal notes for each event

## Troubleshooting

### No Events Showing
- **Check Data**: Ensure members have valid `birthDate` or `marriageDate` fields
- **Date Format**: Dates should be in ISO format (YYYY-MM-DD)
- **Current Month**: Only shows events for the current calendar month

### Checkboxes Not Saving
- **Browser Storage**: Check if localStorage is enabled in your browser
- **Private Mode**: localStorage may not work in private/incognito mode
- **Browser Permissions**: Ensure the site has permission to use localStorage

### Wrong Dates Displaying
- **Data Import**: Verify that birth/marriage dates were imported correctly
- **Date Format**: Check that dates are in the correct format
- **Time Zone**: All dates are processed in the local timezone 