/**
 * Demo Location Override Script V2 - React State Direct Manipulation
 *
 * This script directly manipulates React component state to force location updates.
 * More aggressive approach for stubborn apps.
 */

(function() {
  console.log('🎬 Loading Demo Location Override Script V2...');

  // Demo configuration
  const DEMO_CONFIG = {
    updateInterval: 200, // Update every 200ms for visible movement
    routes: {
      'biscayne-north': {
        name: "Biscayne Boulevard North",
        description: "Straight drive north on Biscayne Boulevard - smooth demo",
        points: [
          { lat: 25.7900, lng: -80.2050 }, // South - Downtown Miami
          { lat: 25.8500, lng: -80.2050 }, // North - Upper Miami (same longitude = straight line)
        ],
        duration: 180 // 1 minute for smooth demo
      },
      'miami-to-fiu': {
        name: "Miami Beach to FIU",
        description: "Drive from Miami Beach to Florida International University",
        points: [
          { lat: 25.7617, lng: -80.1918 }, // Miami Beach (Lincoln Road)
          { lat: 25.7717, lng: -80.1850 }, // Moving west
          { lat: 25.7800, lng: -80.1950 }, // Julia Tuttle Causeway
          { lat: 25.7850, lng: -80.2100 }, // Cross bay
          { lat: 25.7900, lng: -80.2200 }, // Mainland Miami
          { lat: 25.7950, lng: -80.2300 }, // Moving southwest
          { lat: 25.8000, lng: -80.2400 }, // Through Miami neighborhoods
          { lat: 25.8100, lng: -80.2500 }, // Continuing west
          { lat: 25.8200, lng: -80.2600 }, // Getting closer to FIU
          { lat: 25.8300, lng: -80.2700 }, // Almost there
          { lat: 25.7563, lng: -80.3759 }, // FIU Modesto Maidique Campus
        ],
        duration: 180 // 3 minutes total
      }
    }
  };

  // Demo state
  let demoState = {
    isActive: false,
    currentRoute: null,
    startTime: 0,
    speed: 1,
    intervalId: null,
    currentLat: 0,
    currentLng: 0,
    reactNodes: null
  };

  // Store original geolocation
  const originalGeolocation = navigator.geolocation;

  // Linear interpolation helper
  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  // Calculate current position based on route progress
  function calculateCurrentPosition() {
    if (!demoState.currentRoute) return { lat: 0, lng: 0 };

    const elapsed = (Date.now() - demoState.startTime) / 1000; // seconds
    const totalDuration = demoState.currentRoute.duration / demoState.speed;
    const progress = Math.min(1, elapsed / totalDuration);

    const points = demoState.currentRoute.points;
    if (points.length < 2) {
      return points[0] || { lat: 0, lng: 0 };
    }

    // Calculate which segment we're on
    const totalSegments = points.length - 1;
    const segmentProgress = progress * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const withinSegmentProgress = segmentProgress - currentSegment;

    // Handle route completion (loop back to start)
    if (currentSegment >= totalSegments) {
      demoState.startTime = Date.now(); // Reset for loop
      return points[0];
    }

    // Interpolate between current segment points
    const startPoint = points[currentSegment];
    const endPoint = points[currentSegment + 1];

    return {
      lat: lerp(startPoint.lat, endPoint.lat, withinSegmentProgress),
      lng: lerp(startPoint.lng, endPoint.lng, withinSegmentProgress)
    };
  }

  // Find React fiber node
  function findReactFiber(element) {
    for (let key in element) {
      if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
        return element[key];
      }
    }
    return null;
  }

  // Find React component with userLocation state
  function findUserLocationComponent() {
    // Try to find the map component or any component with userLocation state
    const mapElements = document.querySelectorAll('[data-testid*="map"], .map-container, [class*="map"], [class*="Map"]');

    for (let element of mapElements) {
      const fiber = findReactFiber(element);
      if (fiber) {
        // Traverse up the fiber tree to find component with userLocation
        let currentFiber = fiber;
        while (currentFiber) {
          if (currentFiber.memoizedState) {
            // Check if this component has userLocation in its state
            let state = currentFiber.memoizedState;
            while (state) {
              if (state.memoizedState &&
                  typeof state.memoizedState === 'object' &&
                  (state.memoizedState.lat !== undefined || state.memoizedState.latitude !== undefined)) {
                console.log('🎯 Found component with location state:', state.memoizedState);
                return { fiber: currentFiber, stateHook: state };
              }
              state = state.next;
            }
          }
          currentFiber = currentFiber.return;
        }
      }
    }

    // Fallback: search all elements
    const allElements = document.querySelectorAll('*');
    for (let element of allElements) {
      const fiber = findReactFiber(element);
      if (fiber && fiber.memoizedState) {
        let state = fiber.memoizedState;
        while (state) {
          if (state.memoizedState &&
              typeof state.memoizedState === 'object' &&
              (state.memoizedState.lat !== undefined || state.memoizedState.latitude !== undefined)) {
            console.log('🎯 Found component with location state (fallback):', state.memoizedState);
            return { fiber, stateHook: state };
          }
          state = state.next;
        }
      }
    }

    return null;
  }

  // Force React component to update with new location
  function forceReactLocationUpdate(lat, lng) {
    try {
      if (!demoState.reactNodes) {
        demoState.reactNodes = findUserLocationComponent();
      }

      if (demoState.reactNodes) {
        const { stateHook } = demoState.reactNodes;

        // Update the state directly
        if (stateHook.memoizedState && typeof stateHook.memoizedState === 'object') {
          const newLocation = { lat, lng };

          // Try different property names
          if (stateHook.memoizedState.lat !== undefined) {
            stateHook.memoizedState.lat = lat;
            stateHook.memoizedState.lng = lng;
          } else if (stateHook.memoizedState.latitude !== undefined) {
            stateHook.memoizedState.latitude = lat;
            stateHook.memoizedState.longitude = lng;
          }

          console.log('🔄 Updated React state directly:', newLocation);

          // Force re-render by calling the setter if available
          if (stateHook.queue && stateHook.queue.dispatch) {
            stateHook.queue.dispatch(newLocation);
            console.log('📡 Triggered React state setter');
          }

          return true;
        }
      }
    } catch (error) {
      console.warn('⚠️ React state update failed:', error);
    }
    return false;
  }

  // Enhanced geolocation override
  const mockGeolocation = {
    getCurrentPosition: function(successCallback, errorCallback, options) {
      console.log('🎯 getCurrentPosition called, demo active:', demoState.isActive);

      if (demoState.isActive) {
        const position = calculateCurrentPosition();
        demoState.currentLat = position.lat;
        demoState.currentLng = position.lng;

        console.log('📍 Providing demo position:', position);

        // Also try to update React state directly
        forceReactLocationUpdate(position.lat, position.lng);

        setTimeout(() => {
          successCallback({
            coords: {
              latitude: position.lat,
              longitude: position.lng,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        }, 10);
      } else {
        originalGeolocation.getCurrentPosition(successCallback, errorCallback, options);
      }
    },

    watchPosition: function(successCallback, errorCallback, options) {
      console.log('👀 watchPosition called, demo active:', demoState.isActive);

      if (demoState.isActive) {
        const watchId = Math.random();

        // Immediately call with current position
        const position = calculateCurrentPosition();
        demoState.currentLat = position.lat;
        demoState.currentLng = position.lng;

        // Try to update React state directly
        forceReactLocationUpdate(position.lat, position.lng);

        setTimeout(() => {
          successCallback({
            coords: {
              latitude: position.lat,
              longitude: position.lng,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        }, 10);

        return watchId;
      } else {
        return originalGeolocation.watchPosition(successCallback, errorCallback, options);
      }
    },

    clearWatch: function(watchId) {
      if (!demoState.isActive) {
        originalGeolocation.clearWatch(watchId);
      }
    }
  };

  // Demo control functions
  window.demoLocation = {
    // Start demo with specified route
    start: function(routeName = 'biscayne-north', speed = 1) {
      const route = DEMO_CONFIG.routes[routeName];
      if (!route) {
        console.error('❌ Route not found:', routeName);
        return false;
      }

      if (demoState.isActive) {
        console.warn('⚠️ Demo already active, stopping previous demo...');
        this.stop();
      }

      demoState.isActive = true;
      demoState.currentRoute = route;
      demoState.speed = speed;
      demoState.startTime = Date.now();
      demoState.reactNodes = null; // Reset React node cache

      // Override geolocation
      navigator.geolocation = mockGeolocation;

      console.log(`🎬 Demo started: ${route.name}`);
      console.log(`📍 ${route.points.length} waypoints, ${route.duration}s duration, ${speed}x speed`);

      // Find React components
      console.log('🔍 Searching for React components with location state...');
      demoState.reactNodes = findUserLocationComponent();

      // Start position updates
      demoState.intervalId = setInterval(() => {
        const position = calculateCurrentPosition();
        demoState.currentLat = position.lat;
        demoState.currentLng = position.lng;

        console.log(`🚗 Moving to: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);

        // Force React state update
        forceReactLocationUpdate(position.lat, position.lng);

        // Also trigger geolocation callbacks
        navigator.geolocation.getCurrentPosition(() => {}, () => {});

      }, DEMO_CONFIG.updateInterval);

      // Force initial location
      const initialPos = calculateCurrentPosition();
      forceReactLocationUpdate(initialPos.lat, initialPos.lng);

      return true;
    },

    // Stop demo
    stop: function() {
      if (!demoState.isActive) {
        console.log('ℹ️ Demo is not active');
        return;
      }

      demoState.isActive = false;

      if (demoState.intervalId) {
        clearInterval(demoState.intervalId);
        demoState.intervalId = null;
      }

      // Restore original geolocation
      navigator.geolocation = originalGeolocation;

      console.log('🛑 Demo stopped, real GPS restored');
    },

    // Get current status
    status: function() {
      const status = {
        active: demoState.isActive,
        route: demoState.currentRoute?.name || null,
        speed: demoState.speed,
        progress: 0,
        currentLocation: null,
        reactComponent: !!demoState.reactNodes
      };

      if (demoState.isActive && demoState.currentRoute) {
        const elapsed = (Date.now() - demoState.startTime) / 1000;
        const totalDuration = demoState.currentRoute.duration / demoState.speed;
        status.progress = Math.min(1, elapsed / totalDuration);
        status.currentLocation = {
          lat: demoState.currentLat,
          lng: demoState.currentLng
        };
      }

      console.table(status);
      return status;
    },

    // Debug function
    debug: function() {
      console.log('🔍 Debug Info:');
      console.log('Demo active:', demoState.isActive);
      console.log('React nodes found:', !!demoState.reactNodes);

      if (demoState.reactNodes) {
        console.log('React state:', demoState.reactNodes.stateHook.memoizedState);
      }

      // Try to find location components
      const components = findUserLocationComponent();
      console.log('Location components:', components);

      // Test current position
      if (demoState.isActive) {
        const pos = calculateCurrentPosition();
        console.log('Current demo position:', pos);
        forceReactLocationUpdate(pos.lat, pos.lng);
      }
    },

    // Force manual location update
    setLocation: function(lat, lng) {
      console.log(`📍 Manually setting location to: ${lat}, ${lng}`);

      demoState.currentLat = lat;
      demoState.currentLng = lng;

      // Force React update
      forceReactLocationUpdate(lat, lng);

      // Try geolocation override
      if (demoState.isActive) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
    }
  };

  console.log('✅ Demo Location Override Script V2 loaded!');
  console.log('');
  console.log('🎮 Enhanced Commands:');
  console.log('  demoLocation.start()                    - Start straight road demo (Biscayne Blvd)');
  console.log('  demoLocation.start("miami-to-fiu")      - Start complex Miami to FIU route');
  console.log('  demoLocation.setLocation(lat, lng)      - Manually set location');
  console.log('  demoLocation.debug()                    - Show detailed debug info');
  console.log('  demoLocation.status()                   - Show current status');
  console.log('  demoLocation.stop()                     - Stop demo');
  console.log('');
  console.log('🚀 Ready! Try: demoLocation.start() for smooth straight road');
  console.log('📍 Default route: Downtown Miami → North Miami (straight line)');

})();