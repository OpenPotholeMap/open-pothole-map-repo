import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Square } from "lucide-react";
import { socketService } from "@/services/socketService";

interface CameraOverlayProps {
  onClose: () => void;
  potholeCount: number;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onPotholeDetected?: (count: number) => void;
}

const CameraOverlay = ({ onClose, potholeCount, onLocationUpdate, onPotholeDetected }: CameraOverlayProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraList, setShowCameraList] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
          console.log('Pothole detected:', detection);
          if (onPotholeDetected) {
            onPotholeDetected(1); // Increment count by 1
          }
        });

        socketService.onDetectionError((error) => {
          console.error('Detection error:', error);
        });

        // Start detection session
        const session = await socketService.startDetection();
        setSessionId(session.sessionId);

      } catch (error) {
        console.error('Socket connection error:', error);
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
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };

    getCameras();
  }, [selectedCameraId]);

  // Capture and send frames
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !currentLocation || !isConnected) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64 JPEG
    const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Send frame to backend (convert lat/lng to latitude/longitude)
    socketService.sendFrame(frameData, {
      latitude: currentLocation.lat,
      longitude: currentLocation.lng
    });
  }, [currentLocation, isConnected]);

  // Start camera stream
  useEffect(() => {
    const startStream = async () => {
      try {
        setIsInitializing(true);
        setCameraError(null);

        // Create abort controller for timeout handling
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout

        let constraints = {
          video: {
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };

        let stream: MediaStream;

        try {
          // Try with specific device constraints first
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (specificError) {
          console.warn('Failed with specific constraints, trying fallback:', specificError);

          // Fallback to basic constraints without specific device
          constraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          };

          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (fallbackError) {
            console.warn('Failed with fallback constraints, trying minimal:', fallbackError);

            // Ultimate fallback - just request video
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }

        clearTimeout(timeoutId);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to load before setting streaming state
          videoRef.current.onloadedmetadata = () => {
            setIsStreaming(true);
            setIsInitializing(false);
            // Start sending frames every 2 seconds
            frameIntervalRef.current = setInterval(captureFrame, 250);
          };
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        setIsInitializing(false);

        // Set user-friendly error message
        let errorMessage = 'Unknown camera error';
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please enable camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please ensure a camera is connected.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Camera startup timed out. Please try again.';
        } else if (error.message) {
          errorMessage = `Camera error: ${error.message}`;
        }

        setCameraError(errorMessage);
      }
    };

    if (selectedCameraId !== undefined) {
      startStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
    }, 50);

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [isStreaming, currentLocation, isConnected]); // dependent on streaming & location

  // Check if demo script is active and get mock location
  const getDemoLocation = useCallback(() => {
    // Check if the demo script is active and has current location
    if (window.demoLocation) {
      const status = window.demoLocation.status();
      if (status.active && status.currentLocation) {
        return {
          lat: status.currentLocation.lat,
          lng: status.currentLocation.lng
        };
      }
    }
    return null;
  }, []);

  // Get and send location updates
  useEffect(() => {
    if (!isStreaming) return;

    // Check for demo location first
    const updateLocation = () => {
      const demoLocation = getDemoLocation();
      if (demoLocation) {
        console.log('Using demo location:', demoLocation);
        setCurrentLocation(demoLocation);
        if (onLocationUpdate) {
          onLocationUpdate(demoLocation);
        }
        return;
      }

      // Fall back to real GPS location if no demo location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    };

    // Update location immediately
    updateLocation();

    // Set up interval to check for location updates
    const locationInterval = setInterval(updateLocation, 1000); // Check every second

    // Also set up GPS watching as fallback when demo is not active
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Only use GPS if demo is not active
        if (!getDemoLocation()) {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        }
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      clearInterval(locationInterval);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isStreaming, onLocationUpdate, getDemoLocation]);

  const handleStopCamera = async () => {
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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

  const handleRetry = () => {
    setCameraError(null);
    setIsInitializing(true);
    // Reset selected camera to trigger re-initialization
    setSelectedCameraId(availableCameras.length > 0 ? availableCameras[0].deviceId : "");
  };

  return (
    <div className="fixed bottom-6 left-6 z-50
                    w-72 h-48
                    sm:w-80 sm:h-60
                    md:w-96 md:h-72
                    max-sm:w-64 max-sm:h-80
                    bg-black rounded-lg overflow-hidden shadow-xl">
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
                    selectedCameraId === camera.deviceId ? 'bg-gray-700' : ''
                  }`}>
                  {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center">
            <div className="mb-2">Starting camera...</div>
            <div className="text-sm text-gray-300">This may take a few seconds</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {cameraError && !isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center px-4">
            <div className="text-red-400 mb-3">📷</div>
            <div className="text-white text-sm mb-3">{cameraError}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraOverlay;