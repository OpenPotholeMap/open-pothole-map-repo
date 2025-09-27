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
import CameraButton from "@/components/ui/cameraButton";
import CameraOverlay from "@/components/ui/cameraOverlay";
import PotholeMarker from "./potholeMarker";
import { potholeService, type Pothole } from "@/services/potholeService";
import { socketService } from "@/services/socketService";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  const [isLoadingPotholes, setIsLoadingPotholes] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const [markerRef, marker] = useAdvancedMarkerRef();

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
        userLocation={userLocation}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        setSelectedOrigin={setSelectedOrigin}
        setSelectedDestination={setSelectedDestination}
      />

      {/* Camera Detection Components */}
      <CameraButton
        onClick={() => setIsCameraActive(true)}
        isActive={isCameraActive}
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
}

const MapHandler = ({
  userlocation,
  destination,
  origin,
  marker,

  onBoundsChanged,

}: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !marker) return;

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

  }, [origin, destination, map, marker, userlocation]);

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
