import { useTheme } from "@/contexts/theme-context";
import {
  AdvancedMarker,
  Map,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import { useEffect, useState, useCallback, useRef } from "react";
import LocationDrawer from "@/components/pages/map/locationDrawer";
import CompassMarker from "./compassMarker";
import CameraOverlay from "@/components/ui/cameraOverlay";
import PotholeMarker from "./potholeMarker";
import { potholeService, type Pothole } from "@/services/potholeService";
import { socketService } from "@/services/socketService";
import { TooltipProvider } from "@/components/ui/tooltip";
import PotholeToast from "@/components/ui/potholeToast";
import { calculateDistance, isPotholeAhead } from "@/utils/geoUtils";
import BottomRightButtons from "./bottomRightButtons";
import type { LocationDrawerRef } from "./locationDrawer";

// Main Map Page Component
const MapPage = () => {
  const { theme } = useTheme();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [selectedOrigin, setSelectedOrigin] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  const [selectedDestination, setSelectedDestination] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  // Camera detection state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [potholeCount, setPotholeCount] = useState(0);
  const [, setCurrentDetectionLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Pothole markers state
  const [potholes, setPotholes] = useState<Pothole[]>([]);

  // Driving mode state
  const [isDriving, setIsDriving] = useState(false);
  const [showPotholeWarning, setShowPotholeWarning] = useState(false);
  const [warningDistance, setWarningDistance] = useState<number>(0);
  const [userBearing, setUserBearing] = useState<number>(0);
  const [lastUserLocation, setLastUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingPotholes, setIsLoadingPotholes] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const locationDrawerRef = useRef<LocationDrawerRef>(null);

  useEffect(() => {
    let watchId: number;
    let timeoutId: NodeJS.Timeout;

    const getCurrentPosition = () => {
      // Try getCurrentPosition first for faster initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got current position:", position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          // After getting initial position, start watching for updates
          startWatching();
        },
        (error) => {
          console.error("getCurrentPosition failed:", error);
          // If getCurrentPosition fails, try watchPosition
          startWatching();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }
      );
    };

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log("Watch position update:", position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Watch position error:", error, "Code:", error.code);

          // Set fallback location after a timeout if no location is obtained
          timeoutId = setTimeout(() => {
            setUserLocation(prev => {
              if (!prev) {
                console.log("Using fallback location");
                return {
                  lat: 37.7749, // Default to San Francisco
                  lng: -122.4194,
                };
              }
              return prev;
            });
          }, 2000);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    };

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      setUserLocation({
        lat: 37.7749,
        lng: -122.4194,
      });
      return;
    }

    getCurrentPosition();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Track bearing when driving
  useEffect(() => {
    if (isDriving && lastUserLocation && userLocation) {
      // Calculate bearing from previous to current location
      const bearing = calculateBearing(
        lastUserLocation.lat,
        lastUserLocation.lng,
        userLocation.lat,
        userLocation.lng
      );
      setUserBearing(bearing);
    }
    setLastUserLocation(userLocation);

    function calculateBearing(
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number {
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const lat1Rad = (lat1 * Math.PI) / 180;
      const lat2Rad = (lat2 * Math.PI) / 180;

      const y = Math.sin(dLng) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

      let bearing = Math.atan2(y, x);
      bearing = (bearing * 180) / Math.PI;
      bearing = (bearing + 360) % 360;

      return bearing;
    }
  }, [isDriving, lastUserLocation, userLocation]);

  const [markerRef, marker] = useAdvancedMarkerRef();

  // Check for potholes ahead when driving
  useEffect(() => {
    if (!isDriving || !userLocation || potholes.length === 0) {
      setShowPotholeWarning(false);
      return;
    }

    const WARNING_DISTANCE = 200; // meters
    const checkInterval = setInterval(() => {
      for (const pothole of potholes) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          pothole.latitude,
          pothole.longitude
        );

        // Check if pothole is within warning distance and ahead
        if (distance <= WARNING_DISTANCE &&
            isPotholeAhead(
              userLocation.lat,
              userLocation.lng,
              userBearing,
              pothole.latitude,
              pothole.longitude,
              60 // tolerance angle
            )) {
          setWarningDistance(distance);
          setShowPotholeWarning(true);
          break;
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [isDriving, userLocation, potholes, userBearing]);

  // Driving mode handlers
  const handleStartDriving = () => {
    if (!selectedOrigin || !selectedDestination) {
      alert("Please set both start and end locations before starting driving mode.");
      return;
    }
    setIsDriving(true);
    console.log("Driving mode started");
  };

  const handleStopDriving = () => {
    setIsDriving(false);
    setShowPotholeWarning(false);
    setUserBearing(0); // Reset bearing
    console.log("Driving mode stopped");
  };

  // Debounced function to fetch potholes within map bounds
  const fetchPotholesInBounds = useCallback(async (bounds: google.maps.LatLngBounds) => {
    if (isLoadingPotholes) return;

    setIsLoadingPotholes(true);
    try {
      const boundsObj = {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      };

      const potholeData = await potholeService.getPotholesInBounds(boundsObj);
      setPotholes(potholeData);
    } catch (error) {
      console.error('Failed to fetch potholes in bounds:', error);
    } finally {
      setIsLoadingPotholes(false);
    }
  }, [isLoadingPotholes]);

  // Initial load - fetch potholes for default view
  useEffect(() => {
    const fetchInitialPotholes = async () => {
      try {
        const potholeData = await potholeService.getPotholes(100);
        setPotholes(potholeData);
      } catch (error) {
        console.error('Failed to fetch initial potholes:', error);
      }
    };

    fetchInitialPotholes();
  }, []);

  // Set up real-time pothole updates via WebSocket
  useEffect(() => {
    const initializeSocketForMap = async () => {
      try {
        if (!socketService.isSocketConnected()) {
          await socketService.connect();
        }

        // Listen for new potholes
        socketService.onNewPothole((newPothole) => {
          setPotholes(prev => {
            // Check if pothole already exists
            const exists = prev.some(p => p._id === newPothole.id);
            if (!exists) {
              return [...prev, {
                _id: newPothole.id,
                latitude: newPothole.latitude,
                longitude: newPothole.longitude,
                confidenceScore: newPothole.confidenceScore,
                detectedAt: newPothole.detectedAt,
                verified: newPothole.verified,
                detectionCount: newPothole.detectionCount || 1,
                imageUrl: newPothole.imageUrl || `placeholder_${Date.now()}.jpg`
              }];
            }
            return prev;
          });
        });

      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initializeSocketForMap();

    return () => {
      socketService.off('map:new_pothole');
    };
  }, []);

  // Handle pothole verification updates
  const handleVerificationUpdate = async (potholeId: string, verified: boolean) => {
    try {
      const success = await potholeService.updateVerification(potholeId, verified);
      if (success) {
        setPotholes(prev =>
          prev.map(p =>
            p._id === potholeId ? { ...p, verified } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  if (!userLocation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Getting your location...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please allow location access for the best experience
          </p>
        </div>
      </div>
    );
  }

  const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID;

  return (
    <TooltipProvider>
      <main className="h-screen">
        <Map
        mapId={mapId || undefined}
        style={{ width: "100vw", height: "100vh" }}
        defaultCenter={userLocation}
        defaultZoom={17}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        colorScheme={theme === "dark" ? "DARK" : "LIGHT"}>
        <Direction origin={selectedOrigin} destination={selectedDestination} />
        {/* User Location Marker */}
        <CompassMarker position={userLocation} />
        {/* Destination Marker */}
        {!selectedOrigin || !selectedDestination ? (
          <AdvancedMarker
            ref={markerRef}
            position={selectedDestination || undefined}
          />
        ) : null}
        {/* Pothole Markers */}
        {potholes.map((pothole) => (
          <PotholeMarker
            key={pothole._id}
            pothole={pothole}
            onVerificationUpdate={handleVerificationUpdate}
          />
        ))}
      </Map>
      <MapHandler
        destination={selectedDestination}
        userlocation={userLocation}
        origin={selectedOrigin}
        marker={marker}
        isDriving={isDriving}
        userBearing={userBearing}
        onBoundsChanged={(bounds) => {
          // Clear existing debounce
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          // Set new debounce
          debounceRef.current = setTimeout(() => {
            if (bounds) {
              fetchPotholesInBounds(bounds);
            }
          }, 500);
        }}
      />
      <LocationDrawer
        ref={locationDrawerRef}
        userLocation={userLocation}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        setSelectedOrigin={setSelectedOrigin}
        setSelectedDestination={setSelectedDestination}
        onStartDriving={handleStartDriving}
        isDriving={isDriving}
      />

      {/* Bottom Right Buttons */}
      <BottomRightButtons
        onCameraClick={() => {
          if (isCameraActive) {
            // If camera is active, close it
            setIsCameraActive(false);
            setPotholeCount(0);
            setCurrentDetectionLocation(null);
          } else {
            // If camera is not active, open it
            setIsCameraActive(true);
          }
        }}
        isCameraActive={isCameraActive}
        onLocationDrawerOpen={() => locationDrawerRef.current?.openDrawer()}
        onStopDriving={handleStopDriving}
        isDriving={isDriving}
      />

      {isCameraActive && (
        <CameraOverlay
          onClose={() => {
            setIsCameraActive(false);
            setPotholeCount(0);
            setCurrentDetectionLocation(null);
          }}
          potholeCount={potholeCount}
          onLocationUpdate={setCurrentDetectionLocation}
          onPotholeDetected={(count) => {
            setPotholeCount(prev => prev + count);
          }}
        />
      )}

      {/* Pothole Warning Toast */}
      <PotholeToast
        isVisible={showPotholeWarning}
        distance={warningDistance}
        onDismiss={() => setShowPotholeWarning(false)}
      />
      </main>
    </TooltipProvider>
  );
};

// Component to handle directions rendering
const Direction = ({
  origin,
  destination,
}: {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [, setRoutes] = useState<google.maps.DirectionsRoute[] | null>(
    null
  );

  useEffect(() => {
    if (!map || !routesLibrary) return;
    if (!directionsService) {
      setDirectionsService(new routesLibrary.DirectionsService());
    }
    if (!directionsRenderer) {
      setDirectionsRenderer(new routesLibrary.DirectionsRenderer());
    }
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!map || !directionsRenderer || !directionsService) return;
    if (!origin || !destination) {
      directionsRenderer.setMap(null);
      setRoutes(null);
      return;
    }

    directionsRenderer.setMap(map);

    directionsService
      .route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);

      })
      .catch((error) => {
        console.error("Directions request failed:", error);

      });
  }, [directionsService, directionsRenderer, origin, destination, map]);

  return null;
};

// Component to handle map centering and marker positioning
interface MapHandlerProps {
  userlocation?: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number; address?: string } | null;
  origin?: { lat: number; lng: number; address?: string } | null;
  marker: google.maps.marker.AdvancedMarkerElement | null;
  onBoundsChanged?: (bounds: google.maps.LatLngBounds) => void;
  isDriving: boolean;
  userBearing: number;
}

const MapHandler = ({
  userlocation,
  destination,
  origin,
  marker,
  onBoundsChanged,
  isDriving,
  userBearing,
}: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !marker) return;

    // In driving mode, always center on user location and rotate map
    if (isDriving && userlocation) {
      map.setCenter(userlocation);
      // Rotate map so user arrow points up (north)
      // Google Maps heading is clockwise from north, so we need to subtract user bearing
      map.setHeading(userBearing);
      map.setTilt(0); // Keep map flat for better navigation view
      return;
    }

    // Normal mode behavior - reset map rotation
    map.setHeading(0);
    map.setTilt(0);

    if (!destination) {
      if (userlocation) {
        map.setCenter(userlocation);
        return;
      }
    } else if (destination && !origin) {
      map.setCenter({
        lat: destination.lat - 0.0012,
        lng: destination.lng,
      });

      marker.position = destination;
    }

  }, [origin, destination, map, marker, userlocation, isDriving, userBearing]);

  // Set up bounds changed listener for efficient pothole fetching
  useEffect(() => {
    if (!map || !onBoundsChanged) return;

    const boundsChangedListener = map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChanged(bounds);
      }
    });

    return () => {
      if (boundsChangedListener) {
        google.maps.event.removeListener(boundsChangedListener);
      }
    };
  }, [map, onBoundsChanged]);

  return null;
};

export default MapPage;
