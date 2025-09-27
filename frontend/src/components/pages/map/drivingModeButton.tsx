import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface DrivingModeButtonProps {
  onStartDriving: () => void;
  onStopDriving: () => void;
  isDriving: boolean;
  isDisabled?: boolean;
}

const DrivingModeButton = ({
  onStartDriving,
  onStopDriving,
  isDriving,
  isDisabled = false,
}: DrivingModeButtonProps) => {
  const handleClick = () => {
    if (isDriving) {
      onStopDriving();
    } else {
      onStartDriving();
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size="lg"
        className={`
          w-20 h-20 rounded-full shadow-lg transition-all duration-300
          ${
            isDriving
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }
        `}
      >
        {isDriving ? (
          <Square className="w-8 h-8" fill="currentColor" />
        ) : (
          <Play className="w-8 h-8 ml-1" fill="currentColor" />
        )}
      </Button>
      <div className="text-center mt-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDriving ? "Stop" : "Start"}
        </span>
      </div>
    </div>
  );
};

export default DrivingModeButton;