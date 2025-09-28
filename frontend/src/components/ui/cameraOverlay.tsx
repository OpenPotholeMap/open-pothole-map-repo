import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Square } from "lucide-react";
import { socketService } from "@/services/socketService";

interface CameraOverlayProps {
  onClose: () => void;
  potholeCount: number;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onPotholeDetected?: (count: number) => void;
}

const CameraOverlay = ({
  onClose,
  potholeCount,
  onLocationUpdate,
  onPotholeDetected,
}: CameraOverlayProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraList, setShowCameraList] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);

        // Set up event listeners
        socketService.onPotholeDetected((detection) => {
          console.log("Pothole detected:", detection);
          if (onPotholeDetected) {
            onPotholeDetected(1); // Increment count by 1
          }
        });

        socketService.onDetectionError((error) => {
          console.error("Detection error:", error);
        });

        // Start detection session
        const session = await socketService.startDetection();
        setSessionId(session.sessionId);
      } catch (error) {
        console.error("Socket connection error:", error);
      }
    };

    initializeSocket();

    return () => {
      if (sessionId) {
        socketService.stopDetection();
      }
      socketService.disconnect();
    };
  }, []);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
      }
    };

    getCameras();
  }, [selectedCameraId]);

  // Capture and send frames
  const captureFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !currentLocation ||
      !isConnected
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64 JPEG
    const frameData = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    // Send frame to backend (convert lat/lng to latitude/longitude)
    socketService.sendFrame(frameData, {
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
    });
  }, [currentLocation, isConnected]);

  // Start camera stream
  useEffect(() => {
    const startStream = async () => {
      try {
        const constraints = {
          video: {
            deviceId: selectedCameraId
              ? { exact: selectedCameraId }
              : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);

          // Start sending frames every 2 seconds
          frameIntervalRef.current = setInterval(captureFrame, 2000);
        }
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [selectedCameraId]);

  useEffect(() => {
    if (!isStreaming) return;

    frameIntervalRef.current = setInterval(() => {
      captureFrame();
    }, 2000);

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [isStreaming, currentLocation, isConnected]); // dependent on streaming & location

  // Get and send location updates
  useEffect(() => {
    if (!isStreaming) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isStreaming, onLocationUpdate]);

  const handleStopCamera = async () => {
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Clear frame interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Stop detection session
    if (sessionId) {
      await socketService.stopDetection();
    }

    setIsStreaming(false);
    onClose();
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setShowCameraList(false);
  };

  return (
    <div
      className="
      fixed bottom-6 left-6 z-50
      w-64 h-40       /* default mobile size */
      sm:w-60 sm:h-50  /* small screens */
      md:w-96 md:h-60  /* medium+ screens */
      bg-black rounded-lg overflow-hidden shadow-xl
    ">
      {/* Detection Badge */}
      <div className="absolute top-3 left-3 right-3 flex justify-center">
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          {potholeCount} potholes detected
        </div>
      </div>

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-12 left-3 right-3 flex justify-center">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Connecting to server...
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
        {/* Stop Camera Button */}
        <button
          onClick={handleStopCamera}
          className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200"
          aria-label="Stop detection">
          <Square size={16} fill="currentColor" />
        </button>

        {/* Camera Selection */}
        <div className="relative">
          <button
            onClick={() => setShowCameraList(!showCameraList)}
            className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors duration-200"
            aria-label="Select camera">
            <Camera size={16} />
          </button>

          {/* Camera Dropdown */}
          {showCameraList && availableCameras.length > 1 && (
            <div className="absolute bottom-12 right-0 bg-gray-800 text-white rounded-lg shadow-lg min-w-48 max-h-32 overflow-y-auto">
              {availableCameras.map((camera) => (
                <button
                  key={camera.deviceId}
                  onClick={() => handleCameraChange(camera.deviceId)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors duration-200 ${
                    selectedCameraId === camera.deviceId ? "bg-gray-700" : ""
                  }`}>
                  {camera.label ||
                    `Camera ${availableCameras.indexOf(camera) + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Starting camera...</div>
        </div>
      )}
    </div>
  );
};

export default CameraOverlay;
