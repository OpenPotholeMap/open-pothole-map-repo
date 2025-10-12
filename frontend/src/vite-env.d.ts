/// <reference types="vite/client" />

declare global {
  interface Window {
    demoLocation?: {
      start: (routeName?: string, speed?: number) => boolean;
      stop: () => void;
      status: () => {
        active: boolean;
        route: string | null;
        speed: number;
        progress: number;
        currentLocation: { lat: number; lng: number } | null;
        reactComponent: boolean;
      };
      debug: () => void;
      setLocation: (lat: number, lng: number) => void;
    };
  }
}
