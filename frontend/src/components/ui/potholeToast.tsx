import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface PotholeToastProps {
  isVisible: boolean;
  distance?: number;
  onDismiss: () => void;
  autoHideDuration?: number;
}

const PotholeToast = ({
  isVisible,
  distance,
  onDismiss,
}: PotholeToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Don't auto-hide here - let the parent component control the timing
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible && !show) return null;

  return (
    <div
      className={`
        fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]
        bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-600
        flex items-center space-x-3 min-w-80 max-w-md
        transition-all duration-300 ease-in-out
        ${
          show
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-full opacity-0 scale-95"
        }
      `}
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
      }}>
      <AlertTriangle className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-bold text-lg">⚠️ POTHOLE AHEAD!</div>
        {distance && (
          <div className="text-sm opacity-90 font-medium">
            {distance < 100
              ? `${Math.round(distance)}m ahead`
              : `${(distance / 1000).toFixed(1)}km ahead`}
          </div>
        )}
        <div className="text-xs opacity-75 mt-1">
          Slow down and drive carefully
        </div>
      </div>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onDismiss, 300);
        }}
        className="text-white hover:text-gray-200 transition-colors"
        aria-label="Dismiss warning">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PotholeToast;
