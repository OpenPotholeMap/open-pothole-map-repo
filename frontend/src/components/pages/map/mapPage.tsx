import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useState } from "react";

export const mapPage = () => {
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log(position);
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
            // display anx   error if we cant get the users position
            console.error('Error getting user location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );

    if (!userLocation) {
        return <div>Loading...</div>;
    }
    return (
        <>
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <Map
                style={{width: '100vw', height: '100vh'}}
                defaultCenter={userLocation}
                defaultZoom={20}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
            <Marker position={userLocation} />
            </Map>
        </APIProvider>
      </>
    );
}