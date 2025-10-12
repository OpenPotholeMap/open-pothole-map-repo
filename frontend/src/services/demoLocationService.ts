/**
 * Demo Location Service
 * Provides smooth location simulation for demo purposes with interpolated movement
 */

export interface DemoLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface DemoRoute {
  name: string;
  description: string;
  points: { lat: number; lng: number }[];
  duration: number; // Total duration in seconds
}

class DemoLocationService {
  private isDemoMode = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Array<(location: DemoLocation) => void> = [];
  private currentRoute: DemoRoute | null = null;
  private speed = 1; // Speed multiplier (1 = normal, 2 = 2x speed, etc.)

  // Smooth movement state
  private startTime = 0;
  private currentLat = 0;
  private currentLng = 0;
  // private targetSegmentIndex = 0;
  private updateInterval = 100; // Update every 100ms for smooth movement

  // Predefined demo routes
  private routes: DemoRoute[] = [
    {
      name: "Miami to FIU",
      description: "Drive from Miami Beach to Florida International University",
      points: [
        { lat: 25.7617, lng: -80.1918 }, // Miami Beach (Lincoln Road)
        { lat: 25.7717, lng: -80.185 }, // Moving west
        { lat: 25.78, lng: -80.195 }, // Julia Tuttle Causeway
        { lat: 25.785, lng: -80.21 }, // Cross bay
        { lat: 25.79, lng: -80.22 }, // Mainland Miami
        { lat: 25.795, lng: -80.23 }, // Moving southwest
        { lat: 25.8, lng: -80.24 }, // Through Miami neighborhoods
        { lat: 25.81, lng: -80.25 }, // Continuing west
        { lat: 25.82, lng: -80.26 }, // Getting closer to FIU
        { lat: 25.83, lng: -80.27 }, // Almost there
        { lat: 25.7563, lng: -80.3759 }, // FIU Modesto Maidique Campus
      ],
      duration: 180, // 3 minutes total for realistic demo
    },
    {
      name: "Downtown Miami Circuit",
      description: "Loop around Downtown Miami and Brickell",
      points: [
        { lat: 25.7743, lng: -80.1937 }, // Downtown Miami Start
        { lat: 25.7643, lng: -80.1937 }, // Moving south (Brickell)
        { lat: 25.7543, lng: -80.1937 }, // Further south
        { lat: 25.7543, lng: -80.2037 }, // Moving west
        { lat: 25.7643, lng: -80.2037 }, // Moving north
        { lat: 25.7743, lng: -80.2037 }, // Back to start area
        { lat: 25.7743, lng: -80.1937 }, // Complete the loop
      ],
      duration: 120, // 2 minutes
    },
    {
      name: "Miami Airport to South Beach",
      description: "Drive from Miami International Airport to South Beach",
      points: [
        { lat: 25.7932, lng: -80.2906 }, // Miami International Airport
        { lat: 25.7832, lng: -80.2706 }, // Moving northeast
        { lat: 25.7732, lng: -80.2506 }, // Continuing northeast
        { lat: 25.7632, lng: -80.2306 }, // Through Miami
        { lat: 25.7532, lng: -80.2106 }, // Getting closer to beach
        { lat: 25.7432, lng: -80.1906 }, // Almost there
        { lat: 25.7332, lng: -80.1706 }, // South Beach area
      ],
      duration: 150, // 2.5 minutes
    },
  ];

  /**
   * Start demo mode with a specific route
   */
  startDemo(routeName?: string, speed: number = 1): boolean {
    if (this.isDemoMode) {
      console.warn("Demo mode already active");
      return false;
    }

    const route = routeName
      ? this.routes.find((r) => r.name === routeName)
      : this.routes[0];

    if (!route) {
      console.error("Route not found:", routeName);
      return false;
    }

    this.currentRoute = route;
    this.speed = speed;
    this.isDemoMode = true;

    // Initialize smooth movement
    this.startTime = Date.now();
    // this.targetSegmentIndex = 0;
    this.currentLat = route.points[0].lat;
    this.currentLng = route.points[0].lng;

    console.log(`🎬 Starting demo mode: ${route.name}`);
    console.log(
      `📍 ${route.points.length} waypoints, ${route.duration}s duration, ${speed}x speed`
    );
    console.log(
      `🎯 Starting at: ${this.currentLat.toFixed(6)}, ${this.currentLng.toFixed(
        6
      )}`
    );

    this.startSmoothMovement();
    return true;
  }

  /**
   * Stop demo mode and return to real GPS
   */
  stopDemo(): void {
    if (!this.isDemoMode) return;

    this.isDemoMode = false;
    this.currentRoute = null;

    this.stopMovement();

    console.log("🛑 Demo mode stopped");
  }

  /**
   * Check if demo mode is active
   */
  isActive(): boolean {
    return this.isDemoMode;
  }

  /**
   * Get current demo location (interpolated)
   */
  getCurrentLocation(): DemoLocation | null {
    if (!this.isDemoMode || !this.currentRoute) return null;

    return {
      lat: this.currentLat,
      lng: this.currentLng,
      timestamp: Date.now(),
    };
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: DemoLocation) => void): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get available demo routes
   */
  getAvailableRoutes(): DemoRoute[] {
    return [...this.routes];
  }

  /**
   * Get current route info
   */
  getCurrentRoute(): DemoRoute | null {
    return this.currentRoute;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    if (!this.currentRoute || !this.isDemoMode) return 0;

    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    const totalDuration = this.currentRoute.duration / this.speed;

    return Math.min(1, elapsed / totalDuration);
  }

  /**
   * Set movement speed
   */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(10, speed)); // Clamp between 0.1x and 10x
    console.log(`⚡ Demo speed changed to ${speed}x`);
  }

  /**
   * Jump to specific point in route (0-1)
   */
  jumpToProgress(progress: number): void {
    if (!this.currentRoute || !this.isDemoMode) return;

    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Calculate new time based on progress
    const totalDuration = this.currentRoute.duration / this.speed;
    const newElapsed = clampedProgress * totalDuration;
    this.startTime = Date.now() - newElapsed * 1000;

    // Update current position
    this.updateCurrentPosition();

    console.log(`🎯 Jumped to ${(progress * 100).toFixed(1)}% progress`);

    // Immediately notify of new location
    const location = this.getCurrentLocation();
    if (location) {
      this.notifyCallbacks(location);
    }
  }

  /**
   * Start smooth movement simulation
   */
  private startSmoothMovement(): void {
    if (!this.currentRoute) return;

    this.intervalId = setInterval(() => {
      this.updateCurrentPosition();

      const location = this.getCurrentLocation();
      if (location) {
        this.notifyCallbacks(location);
      }

      // Check if route completed
      if (this.getProgress() >= 1) {
        console.log("🏁 Demo route completed, looping...");
        this.startTime = Date.now(); // Reset for loop
      }
    }, this.updateInterval);

    // Immediately send first location
    const initialLocation = this.getCurrentLocation();
    if (initialLocation) {
      this.notifyCallbacks(initialLocation);
    }
  }

  /**
   * Update current position based on elapsed time and interpolation
   */
  private updateCurrentPosition(): void {
    if (!this.currentRoute) return;

    const progress = this.getProgress();
    const route = this.currentRoute;
    const points = route.points;

    if (points.length < 2) {
      this.currentLat = points[0]?.lat || 0;
      this.currentLng = points[0]?.lng || 0;
      return;
    }

    // Calculate which segment we're on and position within segment
    const totalSegments = points.length - 1;
    const segmentProgress = progress * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const withinSegmentProgress = segmentProgress - currentSegment;

    // Handle route completion/looping
    if (currentSegment >= totalSegments) {
      this.currentLat = points[0].lat;
      this.currentLng = points[0].lng;
      return;
    }

    // Get current segment points
    const startPoint = points[currentSegment];
    const endPoint = points[currentSegment + 1];

    // Linear interpolation between points
    this.currentLat = this.lerp(
      startPoint.lat,
      endPoint.lat,
      withinSegmentProgress
    );
    this.currentLng = this.lerp(
      startPoint.lng,
      endPoint.lng,
      withinSegmentProgress
    );
  }

  /**
   * Linear interpolation between two values
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Stop the movement simulation
   */
  private stopMovement(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Notify all subscribers of location update
   */
  private notifyCallbacks(location: DemoLocation): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(location);
      } catch (error) {
        console.error("Error in demo location callback:", error);
      }
    });
  }
}

// Export singleton instance
export const demoLocationService = new DemoLocationService();

// Global demo controls for browser console
if (typeof window !== "undefined") {
  (window as any).demoLocation = {
    start: (route?: string, speed = 1) =>
      demoLocationService.startDemo(route, speed),
    stop: () => demoLocationService.stopDemo(),
    routes: () => demoLocationService.getAvailableRoutes(),
    speed: (speed: number) => demoLocationService.setSpeed(speed),
    jump: (progress: number) => demoLocationService.jumpToProgress(progress),
    status: () => ({
      active: demoLocationService.isActive(),
      route: demoLocationService.getCurrentRoute()?.name,
      progress: demoLocationService.getProgress(),
    }),
  };
}
