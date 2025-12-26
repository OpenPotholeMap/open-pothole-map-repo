/// <reference types="vite/client" />

declare global {
  interface Window {
    demoLocation?: {
      start: (routeName?: string, speed?: number) => boolean;
      stop: () => void;
      routes: () => string[];
      speed: (speed: number) => void;
      jump: (progress: number) => void;
      status: () => {
        active: boolean;
        route?: string;
        progress: number;
        currentLocation?: { lat: number; lng: number };
      };
    };
  }
}

export {};