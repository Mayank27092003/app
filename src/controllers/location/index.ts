import { Request, Response } from "express";
import { LocationService } from "../../services/location";
import { UserLiveLocationService } from "../../services/location";
import { HttpException } from "../../utils/httpException";
import { getSocketInstance } from "../../services/socket/instance";
import { LOCATION_EVENTS } from "../../services/socket/constants/events";

export class LocationController {
  private locationService: LocationService;
  private liveService: UserLiveLocationService;

  constructor() {
    this.locationService = new LocationService();
    this.liveService = new UserLiveLocationService();
  }

  /**
   * Get all countries
   */
  getCountries = async (req: Request, res: Response) => {
    try {
      const countries = await this.locationService.getAllCountries();
      res.json({
        success: true,
        data: countries
      });
    } catch (error) {
      throw new HttpException("Failed to fetch countries", 500);
    }
  };

  /**
   * Get states by country code
   */
  getStatesByCountry = async (req: Request, res: Response) => {
    try {
      const { countryCode } = req.params;
      if (!countryCode) {
        throw new HttpException("Country code is required", 400);
      }

      const states = await this.locationService.getStatesByCountry(countryCode as string);
      res.json({
        success: true,
        data: states
      });
    } catch (error) {
      throw new HttpException("Failed to fetch states", 500);
    }
  };

  /**
   * Get cities by state code and country code
   */
  getCitiesByState = async (req: Request, res: Response) => {
    try {
      const { countryCode, stateCode } = req.params;
      if (!countryCode || !stateCode) {
        throw new HttpException("Both country code and state code are required", 400);
      }

      const cities = await this.locationService.getCitiesByState(countryCode as string, stateCode as string);
      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      throw new HttpException("Failed to fetch cities", 500);
    }
  };

  /**
   * Search countries
   */
  searchCountries = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        throw new HttpException("Search query is required", 400);
      }

      const countries = await this.locationService.searchCountries(q as string);
      res.json({
        success: true,
        data: countries
      });
    } catch (error) {
      throw new HttpException("Failed to search countries", 500);
    }
  };

  /**
   * Search states within a country
   */
  searchStates = async (req: Request, res: Response) => {
    try {
      const { countryCode } = req.params;
      const { q } = req.query;

      if (!countryCode) {
        throw new HttpException("Country code is required", 400);
      }

      if (!q || typeof q !== 'string') {
        throw new HttpException("Search query is required", 400);
      }

      const states = await this.locationService.searchStates(countryCode as string, q as string);
      res.json({
        success: true,
        data: states
      });
    } catch (error) {
      throw new HttpException("Failed to search states", 500);
    }
  };

  /**
   * Search cities within a state
   */
  searchCities = async (req: Request, res: Response) => {
    try {
      const { countryCode, stateCode } = req.params;
      const { q } = req.query;

      if (!countryCode || !stateCode) {
        throw new HttpException("Both country code and state code are required", 400);
      }

      if (!q || typeof q !== 'string') {
        throw new HttpException("Search query is required", 400);
      }

      const cities = await this.locationService.searchCities(countryCode as string, stateCode as string, q as string);
      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      throw new HttpException("Failed to search cities", 500);
    }
  };

  /**
   * Get country by ISO code
   */
  getCountryByCode = async (req: Request, res: Response) => {
    try {
      const { countryCode } = req.params;
      if (!countryCode) {
        throw new HttpException("Country code is required", 400);
      }

      const country = await this.locationService.getCountryByCode(countryCode as string);
      if (!country) {
        throw new HttpException("Country not found", 404);
      }

      res.json({
        success: true,
        data: country
      });
    } catch (error) {
      throw new HttpException("Failed to fetch country", 500);
    }
  };

  /**
   * Get state by code within a country
   */
  getStateByCode = async (req: Request, res: Response) => {
    try {
      const { countryCode, stateCode } = req.params;
      if (!countryCode || !stateCode) {
        throw new HttpException("Both country code and state code are required", 400);
      }

      const state = await this.locationService.getStateByCode(countryCode as string, stateCode as string);
      if (!state) {
        throw new HttpException("State not found", 404);
      }

      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      throw new HttpException("Failed to fetch state", 500);
    }
  };

  /**
   * Upsert live location for current user and emit socket event
   */
  upsertMyLocation = async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      const { lat, lng, accuracy, heading, speed, provider, battery } = req.body || {};
      const row = await this.liveService.upsert(Number(userId), {
        lat: Number(lat),
        lng: Number(lng),
        accuracy,
        heading,
        speed,
        provider,
        battery
      });

      // Emit location update to user-specific room
      const io = getSocketInstance();
      const locationUpdate = {
        userId: Number(userId),
        lat: row.lat,
        lng: row.lng,
        speed: row.speed,
        heading: row.heading,
        battery: row.battery,
        accuracy: row.accuracy,
        provider: row.provider,
        timestamp: row.createdAt || new Date().toISOString()
      };

      io.to(`user_location_${userId}`).emit(LOCATION_EVENTS.LOCATION_UPDATE, {
        userId: Number(userId),
        location: locationUpdate
      });

      res.json({ success: true, data: row });
    } catch (error: any) {
      res.status(error?.status || 500).json({ success: false, message: error?.message || "Internal error" });
    }
  };

  /**
   * Get my recent locations
   */
  myRecentLocations = async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const rows = await this.liveService.getRecent(Number(userId), limit);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      res.status(error?.status || 500).json({ success: false, message: error?.message || "Internal error" });
    }
  };
}
