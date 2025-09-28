import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
      >
        ✕
      </Button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-4 z-10 text-white hover:bg-white/20"
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-4 z-10 text-white hover:bg-white/20"
          >
            →
          </Button>
        </>
      )}

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Pothole image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.jpg';
          }}
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto py-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                index === currentIndex ? 'border-white' : 'border-gray-500'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default ImageViewer;