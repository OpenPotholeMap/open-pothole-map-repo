import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface Pothole {
  _id: string;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  detectedAt: string;
  verified: boolean;
  detectionCount: number;
  images: string[];
}

export interface Confirmation {
  _id: string;
  potholeId: string;
  userId: {
    _id: string;
    username: string;
  };
  status: "still_there" | "not_there";
  confirmedAt: string;
}

export interface ConfirmationSummary {
  still_there: number;
  not_there: number;
  total: number;
}

class PotholeService {
  private apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 10000,
  });

  /**
   * Get all potholes for map display
   */
  async getPotholes(limit: number = 100): Promise<Pothole[]> {
    try {
      const response = await this.apiClient.get("/potholes", {
        params: { limit },
      });
      console.log("Fetched potholes:", response.data.data);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching potholes:", error);
      return [];
    }
  }

  /**
   * Get potholes within map bounds
   */
  async getPotholesInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<Pothole[]> {
    try {
      const response = await this.apiClient.get("/potholes/bounds", {
        params: bounds,
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching potholes in bounds:", error);
      return [];
    }
  }

  /**
   * Get pothole by ID
   */
  async getPotholeById(id: string): Promise<Pothole | null> {
    try {
      const response = await this.apiClient.get(`/potholes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching pothole:", error);
      return null;
    }
  }

  /**
   * Update pothole verification status
   */
  async updateVerification(id: string, verified: boolean): Promise<boolean> {
    try {
      await this.apiClient.patch(`/potholes/${id}/verify`, { verified });
      return true;
    } catch (error) {
      console.error("Error updating verification:", error);
      return false;
    }
  }

  /**
   * Create a new pothole
   */
  async createPothole(data: {
    latitude: number;
    longitude: number;
    confidenceScore?: number;
    images?: string[];
    verified?: boolean;
    detectionCount?: number;
  }): Promise<Pothole | null> {
    try {
      const response = await this.apiClient.post("/potholes", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating pothole:", error);
      return null;
    }
  }

  /**
   * Confirm pothole status (logged in users only)
   */
  async confirmPothole(
    id: string,
    status: "still_there" | "not_there",
    userId: string
  ): Promise<boolean> {
    try {
      await this.apiClient.post(`/potholes/${id}/confirm`, { status, userId });
      return true;
    } catch (error) {
      console.error("Error confirming pothole:", error);
      return false;
    }
  }

  /**
   * Get confirmations for a pothole
   */
  async getConfirmations(id: string): Promise<{
    confirmations: Confirmation[];
    summary: ConfirmationSummary;
  } | null> {
    try {
      const response = await this.apiClient.get(
        `/potholes/${id}/confirmations`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching confirmations:", error);
      return null;
    }
  }

  /**
   * Admin verification (admin users only)
   */
  async adminVerifyPothole(
    id: string,
    verified: boolean,
    userId: string
  ): Promise<boolean> {
    try {
      await this.apiClient.patch(`/potholes/${id}/admin-verify`, {
        verified,
        userId,
      });
      return true;
    } catch (error) {
      console.error("Error admin verifying pothole:", error);
      return false;
    }
  }
}

export const potholeService = new PotholeService();
