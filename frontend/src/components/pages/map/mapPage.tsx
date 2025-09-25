import { useTheme } from "@/contexts/theme-context";
import {
  AdvancedMarker,
  Map,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import LocationDrawer from "@/components/pages/map/locationDrawer";
import CompassMarker from "./compassMarker";

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

  navigator.geolocation.watchPosition(
    (position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      console.error("Error getting user location:", error);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );

  const [markerRef, marker] = useAdvancedMarkerRef();

  if (!userLocation) {
    return <div className="py-20">Loading...</div>;
  }

  return (
    <main className="h-screen">
      <Map
        mapId={import.meta.env.VITE_GOOGLE_MAPS_ID}
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
      </Map>
      <MapHandler
        destination={selectedDestination}
        userlocation={userLocation}
        origin={selectedOrigin}
        marker={marker}
      />
      <LocationDrawer
        userLocation={userLocation}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        setSelectedOrigin={setSelectedOrigin}
        setSelectedDestination={setSelectedDestination}
      />
    </main>
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
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[] | null>(
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
}

const MapHandler = ({
  userlocation,
  destination,
  origin,
  marker,
}: MapHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !marker) return;

    if (!destination) {
      console.log("No destination, centering on user location");
      if (userlocation) {
        map.setCenter(userlocation);
        return;
      }
    } else if (destination && !origin) {
      console.log("Destination changed:", destination);

      map.setCenter({
        lat: destination.lat - 0.0012,
        lng: destination.lng,
      });

      marker.position = destination;
    }
  }, [origin, destination, map]);

  return null;
};

export default MapPage;
