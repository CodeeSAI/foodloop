export type FoodCategory = 'hot_meals' | 'bakery' | 'produce' | 'dairy' | 'pantry';

export type StorageType = 'hot' | 'chilled' | 'ambient';

export type DonationStatus = 
  | 'PUBLISHED'
  | 'MATCHED'
  | 'APPROVED'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TrackingStep {
  title: string;
  timestamp: string;
  completed: boolean;
  active: boolean;
  details?: string;
  isoTime?: string;
}

export interface TempReading {
  time: string;
  timestamp?: number;
  tempC: number;
  status: 'safe' | 'warning' | 'critical';
  isSimulated?: boolean;
  notes?: string;
}

export interface ProofOfDelivery {
  recipientSignee: string;
  signatureDate: string;
  handoffTempC: number;
  notes?: string;
  verificationPin?: string;
}

export interface Donation {
  id: string; // e.g. "FD-892"
  title: string;
  category: FoodCategory;
  donorKitchenId?: string;
  donorName: string;
  donorLocation: string;
  donorAddress: string;
  quantityKg: number;
  servings: number;
  packaging: string;
  storageType: StorageType;
  tempTargetC: number;
  cookedOrPackedAt: string;
  expiryDeadline: string; // ISO or relative description
  expiryMinutesRemaining: number;
  expiryHours?: number; // Optional compatibility accessor
  allergens: string[];
  dietaryTags: string[];
  status: DonationStatus;
  matchedRecipientId?: string;
  assignedCourierId?: string;
  pickupWindow: string;
  etaMinutes?: number;
  trackingSteps: TrackingStep[];
  tempTelemetry: TempReading[];
  proofOfDelivery?: ProofOfDelivery;
  notes?: string;
  createdAt: string;
}

export type PlannerPipelineStage = 1 | 2 | 3 | 4 | 5 | 6;

export interface Recipient {
  id: string; // e.g. "REC-01"
  name: string;
  type: 'Community Kitchen' | 'Homeless Shelter' | 'Youth Center' | 'Food Pantry' | 'Family Mission';
  address: string;
  distanceKm: number;
  capacityTotalKg: number;
  capacityUsedKg: number;
  acceptedCategories: FoodCategory[];
  dietaryRequirements: string[];
  coldChainCapable: boolean;
  warmingOvensCapable: boolean;
  currentUrgency: 'High' | 'Normal';
  diningServiceTime?: string;
  contactName: string;
  phone: string;
}

export interface Courier {
  id: string; // e.g. "COU-02"
  name: string;
  vehicleType: 'Electric Van' | 'Cargo E-Bike' | 'Insulated Sprinter';
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  currentStatus: 'Available' | 'Assigned' | 'En Route' | 'Delivering';
  currentLocation: string;
  compartmentTempC: number;
}

export interface AiPlanResult {
  summary: string;
  reasoning: string;
  tradeOffs: string[];
  contingencyPlan: string;
  confidenceScore: number;
  haccpSafetyAssessment: string;
  source: 'openrouter_live' | 'nebius_live' | 'deterministic_fallback' | 'deterministic_fallback_after_api_error' | 'deterministic_fallback_error';
  model: string;
  executionMs: number;
  isLive?: boolean;
  apiError?: string;
}

export interface AiBackendStatus {
  configured: boolean;
  hasKey: boolean;
  model: string;
  baseUrl: string;
  provider?: 'openrouter' | 'nebius' | 'simulation';
  isLiveVerified?: boolean;
  lastError?: string;
  mode: 'live_openrouter_inference' | 'live_nebius_inference' | 'deterministic_fallback_simulation';
  message?: string;
}

export type ActiveView = 
  | 'dashboard'
  | 'create'
  | 'matching'
  | 'planner'
  | 'tracking'
  | 'analytics'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'accessibility';

