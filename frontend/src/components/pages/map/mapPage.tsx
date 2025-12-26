import { useTheme } from "@/context/theme";
import { useAuth } from "@/context/auth";
import {
  AdvancedMarker,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import { logger } from "@/utils/logger";

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
import Direction from "./direction";
import { useCompass } from "./authHook";

// Main Map Page Component
const MapPage = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Compass hook for device orientation
  const { heading, needsPermission, requestPermission } = useCompass();

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

  // Route and directions state
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[] | null>(
    null
  );
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

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
  const [isLoadingPotholes, setIsLoadingPotholes] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const locationDrawerRef = useRef<LocationDrawerRef>(null);

  // Toast state management
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const [currentWarningPothole, setCurrentWarningPothole] = useState<
    string | null
  >(null);
  const toastCooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      logger.error("Geolocation is not supported");
      setUserLocation({
        lat: 37.7749,
        lng: -122.4194,
      });
      return;
    }

    let watchId: number | undefined;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        logger.error("Geolocation error:", error);
        setUserLocation((prev) => {
          if (!prev) {
            return {
              lat: 37.7749,
              lng: -122.4194,
            };
          }
          return prev;
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Update user bearing from device compass heading
  useEffect(() => {
    if (heading !== undefined && heading !== null) {
      setUserBearing(heading);
    }
  }, [heading]);

  const [markerRef, marker] = useAdvancedMarkerRef();

  // Check for potholes ahead when driving with debouncing
  useEffect(() => {
    if (!isDriving || !userLocation) {
      setShowPotholeWarning(false);
      setCurrentWarningPothole(null);
      return;
    }

    const WARNING_DISTANCE = 200; // meters
    const TOAST_COOLDOWN = 3000; // 3 seconds minimum between warnings for same pothole
    const TOAST_DURATION = 6000; // Toast stays visible for 6 seconds

    let closestPothole = null;
    let closestDistance = Infinity;

    for (const pothole of potholes) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        pothole.latitude,
        pothole.longitude
      );

      // Check if pothole is within warning distance
      if (distance <= WARNING_DISTANCE) {
        // If we have a valid bearing, check if pothole is ahead
        if (userBearing > 0) {
          const isAhead = isPotholeAhead(
            userLocation.lat,
            userLocation.lng,
            userBearing,
            pothole.latitude,
            pothole.longitude,
            90 // Increased tolerance angle for demo
          );

          if (isAhead && distance < closestDistance) {
            closestPothole = pothole;
            closestDistance = distance;
          }
        } else {
          // If no bearing available, warn about nearby potholes
          if (distance < closestDistance) {
            closestPothole = pothole;
            closestDistance = distance;
          }
        }
      }
    }

    const now = Date.now();

    if (closestPothole) {
      // Check if we should show warning for this pothole
      const shouldShowWarning =
        currentWarningPothole !== closestPothole._id ||
        now - lastWarningTime > TOAST_COOLDOWN;

      if (shouldShowWarning && !showPotholeWarning) {
        logger.log("⚠️ WARNING: Pothole detected!", {
          distance: closestDistance,
          pothole: closestPothole._id,
          lastWarning: lastWarningTime,
          timeSinceLastWarning: now - lastWarningTime,
        });

        setWarningDistance(closestDistance);
        setShowPotholeWarning(true);
        setCurrentWarningPothole(closestPothole._id);
        setLastWarningTime(now);

        // Clear any existing cooldown timer
        if (toastCooldownRef.current) {
          clearTimeout(toastCooldownRef.current);
        }

        // Auto-hide toast after duration
        toastCooldownRef.current = setTimeout(() => {
          setShowPotholeWarning(false);
        }, TOAST_DURATION);
      }
    }

    return () => {
      if (toastCooldownRef.current) {
        clearTimeout(toastCooldownRef.current);
      }
    };
  }, [
    isDriving,
    userLocation,
    potholes,
    userBearing,
    showPotholeWarning,
    currentWarningPothole,
    lastWarningTime,
  ]);

  // Driving mode handlers
  const handleStartDriving = () => {
    // For demo purposes, allow driving mode without strict origin/destination requirements
    const isDemoMode =
      window.location.search.includes("demo") ||
      localStorage.getItem("demo-mode") === "true" ||
      userLocation?.lat === 25.79; // Miami demo area

    if (!isDemoMode && (!selectedOrigin || !selectedDestination)) {
      alert(
        "Please set both start and end locations before starting driving mode."
      );
      return;
    }

    setIsDriving(true);
    logger.log("🚗 Driving mode started", { isDemoMode, userLocation });
  };

  const handleStopDriving = () => {
    setIsDriving(false);
    setShowPotholeWarning(false);
    setUserBearing(0); // Reset bearing
    logger.log("Driving mode stopped");
  };

  // Debounced function to fetch potholes within map bounds
  const fetchPotholesInBounds = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      if (isLoadingPotholes) return;

      setIsLoadingPotholes(true);
      try {
        const boundsObj = {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        };

        const potholeData = await potholeService.getPotholesInBounds(boundsObj);
        const uniquePotholes = Array.from(
          new Map<string, Pothole>(potholeData.map((p) => [p._id, p])).values()
        );
        setPotholes(uniquePotholes);
      } catch (error) {
        logger.error("Failed to fetch potholes in bounds:", error);
      } finally {
        setIsLoadingPotholes(false);
      }
    },
    [isLoadingPotholes]
  );

  // Initial load - fetch potholes for default view
  useEffect(() => {
    const fetchInitialPotholes = async () => {
      try {
        const potholeData = await potholeService.getPotholes(100);
        // Deduplicate by _id
        const uniquePotholes = Array.from(
          new Map<string, Pothole>(potholeData.map((p) => [p._id, p])).values()
        );
        setPotholes(uniquePotholes);
      } catch (error) {
        logger.error("Failed to fetch initial potholes:", error);
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
          setPotholes((prev) => {
            // Check if pothole already exists
            const exists = prev.some((p) => p._id === newPothole.id);
            if (!exists) {
              return [
                ...prev,
                {
                  _id: newPothole.id,
                  latitude: newPothole.latitude,
                  longitude: newPothole.longitude,
                  confidenceScore: newPothole.confidenceScore,
                  detectedAt: newPothole.detectedAt,
                  verified: newPothole.verified,
                  detectionCount: newPothole.detectionCount || 1,
                  images: newPothole.images || [],
                },
              ];
            }
            return prev;
          });
        });
      } catch (error) {
        logger.error("Socket initialization error:", error);
      }
    };

    initializeSocketForMap();

    return () => {
      socketService.off("map:new_pothole");
    };
  }, []);

  // Handle pothole verification updates
  const handleVerificationUpdate = async (
    potholeId: string,
    verified: boolean
  ) => {
    try {
      const success = await potholeService.updateVerification(
        potholeId,
        verified
      );
      if (success) {
        setPotholes((prev) =>
          prev.map((p) => (p._id === potholeId ? { ...p, verified } : p))
        );
      }
    } catch (error) {
      logger.error("Failed to update verification:", error);
    }
  };

  if (!userLocation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            Getting your location...
          </p>
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
        <GoogleMap
          mapId={mapId || undefined}
          defaultCenter={userLocation}
          defaultZoom={17}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          colorScheme={theme === "dark" ? "DARK" : "LIGHT"}>
          <Direction
            origin={selectedOrigin}
            destination={selectedDestination}
            setRoutes={setRoutes}
            selectedRouteIndex={selectedRouteIndex}
          />
          {/* User Location Marker */}
          <CompassMarker position={userLocation} heading={userBearing} />
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
              currentUser={user}
            />
          ))}
        </GoogleMap>
        <MapHandler
          userlocation={userLocation}
          origin={selectedOrigin}
          destination={selectedDestination}
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
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          setSelectedRouteIndex={setSelectedRouteIndex}
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
          needsPermission={needsPermission}
          requestPermission={requestPermission}
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
              setPotholeCount((prev) => prev + count);
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
}: MapHandlerProps) => {
  const map = useMap();

  // 🚗 Driving mode effect
  useEffect(() => {
    if (!map || !userlocation || !isDriving) return;

    const interval = setInterval(() => {
      map.panTo(userlocation);
      map.setZoom(17);
      map.setTilt(65);
    }, 1000);

    return () => clearInterval(interval);
  }, [map, userlocation, isDriving]);

  // 🗺️ Normal mode effect
  useEffect(() => {
    if (!map || !marker || isDriving) return;

    map.setHeading(0);
    map.setTilt(0);

    if (!destination) {
      if (userlocation) {
        map.setCenter(userlocation);
      }
    } else if (destination && !origin) {
      map.setCenter({
        lat: destination.lat - 0.0012,
        lng: destination.lng,
      });
      marker.position = destination;
    }
  }, [map, marker, origin, destination]);

  // Set up bounds changed listener for efficient pothole fetching
  useEffect(() => {
    if (!map || !onBoundsChanged) return;

    const boundsChangedListener = map.addListener("bounds_changed", () => {
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
