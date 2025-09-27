import { Button } from "@/components/ui/button";
import { Camera, Navigation, Square } from "lucide-react";

interface BottomRightButtonsProps {
  onCameraClick: () => void;
  isCameraActive: boolean;
  onLocationDrawerOpen: () => void;
  onStopDriving: () => void;
  isDriving: boolean;
}

const BottomRightButtons = ({
  onCameraClick,
  isCameraActive,
  onLocationDrawerOpen,
  onStopDriving,
  isDriving,
}: BottomRightButtonsProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-3">
      {/* Stop Driving Button - Only show when driving */}
      {isDriving && (
        <Button
          onClick={onStopDriving}
          size="lg"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
        >
          <Square className="w-6 h-6" fill="currentColor" />
        </Button>
      )}

      {/* Camera Button */}
      <Button
        onClick={onCameraClick}
        size="lg"
        className={`
          w-14 h-14 rounded-full shadow-lg transition-all duration-300
          ${
            isCameraActive
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }
        `}
      >
        <Camera className="w-6 h-6" />
      </Button>

      {/* Going Somewhere Button */}
      <Button
        onClick={onLocationDrawerOpen}
        size="lg"
        className="w-14 h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background shadow-lg"
      >
        <Navigation className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default BottomRightButtons;