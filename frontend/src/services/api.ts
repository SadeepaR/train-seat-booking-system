import axios from 'axios';
import { Station, Train, AvailabilityResponse, Booking, CreateBookingRequest } from '../types';

const API_BASE = '/api';

export const api = {
  // Fetch stations list
  getStations: async (): Promise<Station[]> => {
    const response = await axios.get(`${API_BASE}/stations`);
    return response.data.data;
  },

  // Fetch trains list
  getTrains: async (): Promise<Train[]> => {
    const response = await axios.get(`${API_BASE}/trains`);
    return response.data.data;
  },

  // Check seat availability for exact journey
  getSeatAvailability: async (
    trainId: string,
    originStationId: string,
    destinationStationId: string
  ): Promise<AvailabilityResponse> => {
    const response = await axios.get(`${API_BASE}/availability`, {
      params: { trainId, originStationId, destinationStationId },
    });
    return response.data.data;
  },

  // Create booking
  createBooking: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await axios.post(`${API_BASE}/bookings`, data);
    return response.data.data;
  },

  // Get existing bookings
  getBookings: async (trainId?: string): Promise<Booking[]> => {
    const response = await axios.get(`${API_BASE}/bookings`, {
      params: trainId ? { trainId } : {},
    });
    return response.data.data;
  },

  // Get department admin analytics & stats
  getAdminStats: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE}/admin/stats`);
    return response.data.data;
  },

  // Seed or Reset database
  seedDatabase: async (): Promise<any> => {
    const response = await axios.post(`${API_BASE}/seed`);
    return response.data;
  },
};
