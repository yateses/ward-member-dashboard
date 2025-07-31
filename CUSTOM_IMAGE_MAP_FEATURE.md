# Custom Image Map Feature

## Overview

The Custom Image Map feature replaces Google Maps with a custom image-based mapping system that allows you to use your own area map image and manually place plot pins at specific locations.

## Features

- **Custom Map Image**: Upload and use your own area map image
- **Interactive Plot Pins**: Click to place pins at specific locations on the map
- **Family-Based Plot Creation**: Select families from a dropdown to automatically assign their addresses
- **Address Association**: Each pin represents a specific address from family records
- **Family Assignment**: Link families to plot locations
- **Family Information Display**: View family details when clicking on pins
- **Admin Mode**: Toggle admin mode to add/edit plot locations

## Setup Instructions

### 1. Prepare Your Map Image

1. Create or obtain a map image of your area
2. Recommended format: JPG, PNG, GIF, or WebP
3. Recommended size: 800x600 pixels or larger
4. Ensure the image clearly shows plot boundaries or landmarks

### 2. Configure the Map

1. Navigate to the "Maps" page in the application
2. Click "Map Settings" button
3. In the configuration modal:
   - **Map Image URL**: Enter the URL of your map image
   - **Image Alt Text**: Provide a description of the map
   - **Upload Image**: Alternatively, upload an image file directly
4. Click "Save Configuration"

### 3. Add Plot Locations (Admin Mode)

1. Click "Admin Mode" to enable plot editing
2. Click "Add Plot" to enter plot placement mode
3. Click on the map image where you want to place a plot pin
4. Select a family from the dropdown list - the system will automatically use their address
5. Optionally add notes about the plot location
6. Click "Create Plot" to add the plot
7. Click "Save Changes" to persist your plot locations

### 4. Assign Families to Plots

1. Click on any plot pin to view its details
2. If no family is assigned, click "Assign Family"
3. Select the appropriate family from the dropdown
4. The pin will change color to indicate a family is assigned

## Usage

### Viewing Family Information

- Click on any plot pin to see family information in the side panel
- Green pins indicate plots with assigned families
- Red pins indicate plots without assigned families

### Admin Functions

- **Add Plot**: Place new plot pins on the map
- **Edit Plot**: Modify existing plot locations and addresses
- **Assign Family**: Link families to specific plot locations
- **Save Changes**: Persist all modifications to the database

## Technical Details

### Data Structure

The system stores:
- **Plot Locations**: Address, coordinates (x, y as percentages), and optional family ID
- **Map Configuration**: Image URL and alt text
- **Family Associations**: Links between plot locations and family records

### Coordinate System

- Uses percentage-based coordinates (0-100) for x and y positions
- Coordinates are relative to the image dimensions
- This ensures pins remain in correct positions regardless of screen size

### File Storage

- Map images can be stored as:
  - External URLs (recommended for production)
  - Base64 data URLs (for uploaded files)
  - Local file paths (for development)

## Troubleshooting

### Image Not Loading
- Check that the image URL is accessible
- Ensure the image format is supported
- Verify the image file size is reasonable

### Pins Not Appearing
- Make sure you're in Admin Mode to add pins
- Check that the map configuration is saved
- Verify the image has loaded completely

### Family Assignment Issues
- Ensure families have addresses in their records
- Check that the family data is properly imported
- Verify the plot location has a valid address

## Future Enhancements

Potential improvements for the custom image map:
- **Plot Clustering**: Group nearby plots when zoomed out
- **Search Functionality**: Find plots by address or family name
- **Export/Import**: Backup and restore plot configurations
- **Multiple Maps**: Support for different areas or zones
- **Plot Categories**: Different pin types for different property types 