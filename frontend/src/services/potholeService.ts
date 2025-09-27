import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Pothole {
  _id: string;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  detectedAt: string;
  verified: boolean;
  detectionCount: number;
  imageUrl: string;
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
      const response = await this.apiClient.get('/potholes', {
        params: { limit }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching potholes:', error);
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
      const response = await this.apiClient.get('/potholes/bounds', {
        params: bounds
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching potholes in bounds:', error);
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
      console.error('Error fetching pothole:', error);
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
      console.error('Error updating verification:', error);
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
    imageUrl?: string;
    verified?: boolean;
    detectionCount?: number;
  }): Promise<Pothole | null> {
    try {
      const response = await this.apiClient.post('/potholes', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating pothole:', error);
      return null;
    }
  }
}

export const potholeService = new PotholeService();