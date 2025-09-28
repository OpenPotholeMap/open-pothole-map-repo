import { useEffect, useState } from "react";

export function useCompass() {
  const [heading, setHeading] = useState<number>(0);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleOrientation = (
      event: DeviceOrientationEvent & { webkitCompassHeading?: number }
    ) => {
      let compassdir: number | null = null;

      if (typeof event.webkitCompassHeading !== "undefined") {
        compassdir = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        compassdir = event.alpha;
      }

      if (compassdir !== null) setHeading(compassdir);
    };

    if (typeof DeviceOrientationEvent === "undefined") return;

    if (
      typeof (
        DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<string>;
        }
      ).requestPermission === "function"
    ) {
      setNeedsPermission(true);
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
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

          if (compassdir !== null) setHeading(compassdir);
        };

        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    } finally {
      setLoading(false);
    }
  };

  return { heading, needsPermission, loading, requestPermission };
}
