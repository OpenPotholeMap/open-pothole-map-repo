import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

const Direction = ({
  origin,
  destination,
  setRoutes,
  selectedRouteIndex, // <- pass in selected route index
}: {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  setRoutes: (routes: google.maps.DirectionsRoute[] | null) => void;
  selectedRouteIndex: number | null; // highlight this one
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);

  const [renderers, setRenderers] = useState<google.maps.DirectionsRenderer[]>(
    []
  );

  useEffect(() => {
    if (!map || !routesLibrary) return;
    if (!directionsService) {
      setDirectionsService(new routesLibrary.DirectionsService());
    }
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!map || !directionsService) return;
    if (!origin || !destination) {
      renderers.forEach((r) => r.setMap(null));
      setRenderers([]);
      setRoutes(null);
      return;
    }

    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((response) => {
        setRoutes(response.routes);

        // clear old renderers
        renderers.forEach((r) => r.setMap(null));

        // create a renderer for each route
        const newRenderers = response.routes.map((_, i) => {
          const renderer = new google.maps.DirectionsRenderer({
            map,
            directions: response,
            routeIndex: i,
            polylineOptions: {
              strokeColor: i === selectedRouteIndex ? "blue" : "gray",
              strokeOpacity: i === selectedRouteIndex ? 1.0 : 0.4,
              strokeWeight: i === selectedRouteIndex ? 6 : 4,
            },
          });
          return renderer;
        });

        setRenderers(newRenderers);
      })
      .catch((error) => {
        console.error("Directions request failed:", error);
      });
  }, [directionsService, origin, destination, map, selectedRouteIndex]);

  return null;
};

export default Direction;
