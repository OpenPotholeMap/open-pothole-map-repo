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
  autoHideDuration = 5000,
}: PotholeToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, autoHideDuration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, autoHideDuration, onDismiss]);

  if (!isVisible && !show) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg
        flex items-center space-x-3 min-w-80 max-w-md
        transition-all duration-300 ease-in-out
        ${show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
    >
      <AlertTriangle className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-bold text-lg">Pothole Ahead!</div>
        {distance && (
          <div className="text-sm opacity-90">
            {distance < 100
              ? `${Math.round(distance)}m ahead`
              : `${(distance / 1000).toFixed(1)}km ahead`
            }
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onDismiss, 300);
        }}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PotholeToast;