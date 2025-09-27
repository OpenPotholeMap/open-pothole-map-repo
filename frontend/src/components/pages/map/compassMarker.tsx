import { useEffect, useState } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

const CompassMarker = ({
  position,
}: {
  position: { lat: number; lng: number };
}) => {
  const [heading, setHeading] = useState<number>(0);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("CompassMarker mounted");

    const handleOrientation = (
      event: DeviceOrientationEvent & { webkitCompassHeading?: number }
    ) => {
      let compassdir: number | null = null;

      if (typeof event.webkitCompassHeading !== "undefined") {
        // iOS Safari/Chrome: true heading
        compassdir = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Other browsers: alpha (relative to north)
        compassdir = event.alpha;
      }

      if (compassdir !== null) {
        setHeading(compassdir);
        console.log("Heading changed:", compassdir);
      } else {
        console.log("Compass not supported on this device");
      }
    };

    if (typeof DeviceOrientationEvent === "undefined") {
      console.log("Compass not supported on this device");
      return;
    }

    if (
      typeof (
        DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<string>;
        }
      ).requestPermission === "function"
    ) {
      // iOS 13+ requires explicit permission
      setNeedsPermission(true);
    } else {
      // Non-iOS browsers → just attach
      window.addEventListener("deviceorientation", handleOrientation, true);
      console.log("Compass event listeners added");
    }

    return () => {
      console.log("CompassMarker unmounted, removing event listeners");
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true);
      const response = await (
        DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission();
      if (response === "granted") {
        setNeedsPermission(false);

        const handleOrientation = (
          event: DeviceOrientationEvent & { webkitCompassHeading?: number }
        ) => {
          let compassdir: number | null = null;

          if (typeof event.webkitCompassHeading !== "undefined") {
            compassdir = event.webkitCompassHeading;
          } else if (event.alpha !== null) {
            compassdir = event.alpha;
          }

          if (compassdir !== null) {
            setHeading(compassdir);
            console.log("Heading changed:", compassdir);
          } else {
            console.log("Compass not supported on this device");
          }
        };

        window.addEventListener("deviceorientation", handleOrientation, true);
      } else {
        console.log("Compass permission denied");
      }
    } catch (err) {
      console.log("Compass permission denied:", err);
    } finally {
      setLoading(false);
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
            // rotate so that 0° = north
            transform: `rotate(${heading}deg)`,
            transformOrigin: "center center",
          }}
        />
      </AdvancedMarker>
    </>
  );
};

export default CompassMarker;
