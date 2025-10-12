# 🎬 Demo Mode Instructions

This guide explains how to set up location simulation for demos of the OpenPotholeMap application.

## Quick Start

1. **Start your application**
   ```bash
   # Frontend
   cd frontend && npm run dev

   # Backend
   cd backend && npm run dev
   ```

2. **Open the app in browser** (usually `http://localhost:5173`)

3. **Open Developer Console** (Press `F12` or right-click → Inspect → Console)

4. **Copy and paste the demo script**:
   - Go to `/frontend/public/demo-script.js`
   - Copy the entire contents
   - Paste into browser console and press Enter

5. **Start the demo**:
   ```javascript
   demoLocation.start()
   ```

## Demo Commands

### Basic Commands
```javascript
// Start default route (Miami Beach to FIU)
demoLocation.start()

// Start specific route
demoLocation.start("downtown-loop")

// Stop demo (restore real GPS)
demoLocation.stop()

// Check current status
demoLocation.status()
```

### Advanced Controls
```javascript
// Change speed (0.1x to 10x)
demoLocation.speed(2)     // 2x speed
demoLocation.speed(0.5)   // Half speed

// Jump to specific progress (0 = start, 1 = end)
demoLocation.jump(0.5)    // Jump to 50% of route

// List available routes
demoLocation.routes()
```

## Available Demo Routes

### 1. Miami Beach to FIU (`miami-to-fiu`)
- **Start**: Miami Beach (Lincoln Road)
- **End**: Florida International University
- **Duration**: 3 minutes
- **Description**: Drive from Miami Beach across the bay to FIU campus

### 2. Downtown Miami Circuit (`downtown-loop`)
- **Start/End**: Downtown Miami
- **Duration**: 2 minutes
- **Description**: Loop around Downtown Miami and Brickell area

## How It Works

The demo script:
1. **Overrides** the browser's `navigator.geolocation` API
2. **Provides smooth interpolated movement** between waypoints (updates every 100ms)
3. **Calculates realistic coordinates** along the route
4. **Automatically loops** when reaching the end
5. **Maintains compatibility** with existing location code

## For Presentations

### Pre-Demo Setup
1. Load the demo script before your presentation
2. Test with `demoLocation.start()` to verify it works
3. Stop with `demoLocation.stop()` and wait for real demo

### During Demo
```javascript
// Start smooth movement
demoLocation.start("miami-to-fiu", 1.5)  // 1.5x speed

// If you need to speed up during demo
demoLocation.speed(3)

// Jump ahead if running out of time
demoLocation.jump(0.8)   // Jump to 80%

// Stop when done
demoLocation.stop()
```

### Troubleshooting

**Demo not working?**
- Make sure the script loaded successfully (should see "✅ Demo Location Override Script loaded!")
- Check that `demoLocation` object exists: `console.log(demoLocation)`
- Verify route name is correct: `demoLocation.routes()`

**App not detecting location changes?**
- Some apps cache location or use `getCurrentPosition()` only once
- Try refreshing the page after starting demo
- The script works best with apps that use `watchPosition()`

**Need custom route?**
- Edit the `DEMO_CONFIG.routes` in the script
- Add your own waypoints as `{ lat: number, lng: number }` objects
- Adjust `duration` for desired speed

## Technical Details

- **Update Frequency**: 100ms for smooth movement
- **Interpolation**: Linear interpolation between waypoints
- **Coordinate System**: Standard GPS coordinates (latitude, longitude)
- **Accuracy**: Simulated 10-meter accuracy
- **Compatibility**: Works with all geolocation-based apps

## Example Session

```javascript
// Check available routes
demoLocation.routes()

// Start Miami to FIU demo at 2x speed
demoLocation.start("miami-to-fiu", 2)

// Check progress
demoLocation.status()

// Slow down for detailed demonstration
demoLocation.speed(0.5)

// Jump to interesting part
demoLocation.jump(0.7)

// Stop demo
demoLocation.stop()
```

Perfect for demonstrating pothole detection, navigation, location-based features, and any GPS-dependent functionality!