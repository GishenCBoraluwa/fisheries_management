import { Decimal } from '@prisma/client/runtime/library';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface CreateOrderRequest {
  userId: number;
  deliveryDate: string;
  deliveryTimeSlot?: string;
  freshnessRequirementHours?: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryAddress: string;
  orderItems: OrderItemRequest[];
  specialInstructions?: string;
}

export interface OrderItemRequest {
  fishTypeId: number;
  quantityKg: number;
  unitPrice: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  newCustomers: number;
  activeAccounts: number;
  activeAccountsGrowth: number;
  ongoingTrucks: number;
}

export interface RevenueData {
  month: string;
  currentYear: number;
  previousYear: number;
}

export interface FishSalesData {
  month: string;
  sales: number;
}

export interface WeatherData {
  forecastDate: string;
  location: string;
  temperature2mMean: number;
  windSpeed10mMax: number;
  precipitationSum: number;
  relativeHumidity2mMean: number;
}

export interface TruckInfo {
  id: number;
  licensePlate: string;
  availabilityStatus: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  driver?: {
    id: number;
    driverName: string;
    phoneNumber: string;
  } | null;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    timezone: string;
  };
  delivery: {
    defaultAddress?: string;
    preferredTimeSlot?: string;
    specialInstructions?: string;
  };
}