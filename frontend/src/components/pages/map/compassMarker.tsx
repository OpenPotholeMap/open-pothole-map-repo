import { useEffect, useState } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

const CompassMarker = ({
  position,
}: {
  position: { lat: number; lng: number };
}) => {
  const [heading, setHeading] = useState<number>(0);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // 🔥 new state

  useEffect(() => {
    console.log("CompassMarker mounted");
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setHeading(event.alpha);
        console.log("Heading changed:", event.alpha); // 🔥 log every movement
      } else {
        console.log("Compass not supported on this device");
      }
    };

    if (typeof DeviceOrientationEvent === "undefined") {
      console.log("Compass not supported on this device");
      return;
    }

    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      setNeedsPermission(true);
    } else {
      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );
      window.addEventListener("deviceorientation", handleOrientation, true);
      console.log("Compass event listeners added");
    }

    return () => {
      console.log("CompassMarker unmounted, removing event listeners");
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation
      );
    };
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true); // 🔥 show "loading"
      const response = await (
        DeviceOrientationEvent as any
      ).requestPermission();
      if (response === "granted") {
        setNeedsPermission(false);
        window.addEventListener("deviceorientation", (event) => {
          if (event.alpha !== null) {
            setHeading(event.alpha);
            console.log("Heading changed:", event.alpha);
          } else {
            console.log("Compass not supported on this device");
          }
        });
      } else {
        console.log("Compass permission denied");
      }
    } catch (err) {
      console.log("Compass permission denied:", err);
    } finally {
      setLoading(false); // 🔥 reset loading
    }
  };

  return (
    <>
      {needsPermission && (
        <button
          onClick={requestPermission}
          disabled={loading}
          className={`absolute top-10 left-4 z-50 rounded px-4 py-2 text-white shadow-md ${
            loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}>
          {loading ? "Enabling..." : "Enable Compass"}
        </button>
      )}

      <AdvancedMarker position={position}>
        <img
          src="/location-arrow.png"
          alt="User Direction"
          className="h-8 w-auto"
          style={{
            transform: `rotate(${-heading}deg)`,
            transformOrigin: "center center",
          }}
        />
      </AdvancedMarker>
    </>
  );
};

export default CompassMarker;
