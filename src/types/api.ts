export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    wind_speed_10m_max: number[];
    precipitation_sum: number[];
    relative_humidity_2m_mean: number[];
  };
}

export interface PredictionApiRequest {
  fish_type: string;
  prediction_days: number;
  weather_data: Record<string, number>;
  ocean_data: Record<string, number>;
  economic_data: Record<string, number>;
}

export interface PredictionApiResponse {
  success: boolean;
  predictions: {
    avg_ws_price: number[];
    avg_rt_price: number[];
  };
  fish_type: string;
  prediction_days: number;
  confidence_intervals?: any;
  metadata?: {
    model_version: string;
    prediction_date: string;
    features_used: number;
    model_type: string;
    confidence_score: number;
  };
  warnings?: string[];
}

export interface OptimizationApiRequest {
  orders: Array<{
    order_id: number;
    delivery_latitude: number;
    delivery_longitude: number;
    total_weight_kg: number;
    priority: number;
  }>;
  trucks: Array<{
    truck_id: number;
    current_latitude: number;
    current_longitude: number;
    capacity_kg: number;
    cost_per_km: number;
  }>;
  harbors: Array<{
    harbor_id: number;
    latitude: number;
    longitude: number;
  }>;
}

export interface OptimizationApiResponse {
  success: boolean;
  delivery_plans: Array<{
    truck_id: number;
    harbor_id: number;
    orders: number[];
    total_distance_km: number;
    estimated_duration_hours: number;
    total_cost: number;
  }>;
  total_cost: number;
  total_distance: number;
  optimization_time_ms: number;
}
