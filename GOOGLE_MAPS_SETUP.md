# Google Maps Setup Guide

This application includes a Google Maps feature that displays family locations with interactive pins. To use this feature, you need to set up a Google Maps API key.

## Prerequisites

1. A Google Cloud Platform account
2. A project with the Maps JavaScript API enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for API usage)

### 2. Enable the Maps JavaScript API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Maps JavaScript API"
3. Click on it and press "Enable"

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Configure API Key Restrictions (Recommended)

1. Click on the API key you just created
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s) to the allowed referrers:
   - For development: `localhost:*`
   - For production: `yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select "Maps JavaScript API" from the dropdown
6. Click "Save"

### 5. Add API Key to Your Application

1. Open `index.html` in your project
2. Find this line:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=geometry"></script>
   ```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

### 6. Environment Variable (Alternative)

For better security, you can use an environment variable:

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Update the script tag in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=geometry"></script>
   ```

## Features

The Google Maps integration includes:

- **Family Location Pins**: Each family with an address gets a pin on the map
- **Interactive Info Windows**: Click pins to see family details
- **Family Info Panel**: Detailed family information displayed below the map
- **Address Geocoding**: Automatically converts addresses to map coordinates
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Navigate to the "Maps" page in your application
2. The map will automatically load and display pins for all families with addresses
3. Click on any pin to view family details in the side panel
4. Use the "Center Map" button to fit all pins in view
5. Use the "Cluster Pins" toggle to group nearby families

## Troubleshooting

### Map Not Loading
- Check that your API key is correct
- Verify that the Maps JavaScript API is enabled
- Check browser console for error messages
- Ensure your domain is in the allowed referrers list

### No Pins Showing
- Verify that families have addresses in the member data
- Check that addresses are in a format Google can geocode
- Look for geocoding errors in the browser console

### API Quota Exceeded
- Check your Google Cloud Console billing
- Review API usage in the Google Cloud Console
- Consider implementing address caching to reduce API calls

## Cost Considerations

- Google Maps API has a generous free tier
- Geocoding requests are typically very low cost
- Monitor usage in the Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Security Notes

- Never commit your API key to version control
- Use environment variables for production deployments
- Set up proper API key restrictions
- Monitor API usage for unusual activity 