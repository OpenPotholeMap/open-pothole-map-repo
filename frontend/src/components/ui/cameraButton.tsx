import { Camera } from "lucide-react";

interface CameraButtonProps {
  onClick: () => void;
  isActive: boolean;
}

const CameraButton = ({ onClick, isActive }: CameraButtonProps) => {
  if (isActive) return null; // Hide button when camera is active

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors duration-200"
      aria-label="Start pothole detection">
      <Camera size={24} />
    </button>
  );
};

export default CameraButton;