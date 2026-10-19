import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Donation, Recipient, Courier, ActiveView, DonationStatus, ProofOfDelivery, AiBackendStatus, TempReading } from '../types';
import { INITIAL_DONATIONS, INITIAL_RECIPIENTS, INITIAL_COURIERS } from '../data/seedData';
import { getAiBackendStatus } from '../services/aiService';
import { evaluateRecipientConstraints } from '../utils/constraintEngine';
import { generateSimulatedTelemetrySample, evaluateThermalSafety } from '../utils/telemetryEngine';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'alert';
}

export interface DonorOrg {
  id: string;
  name: string;
  sub: string;
  address: string;
}

export const ALL_KITCHENS_ID = 'all';

export const ALL_KITCHENS_ORG: DonorOrg = {
  id: ALL_KITCHENS_ID,
  name: 'All Commercial Kitchens',
  sub: 'Network-wide Unified Operations',
  address: 'Regional Rescue Network (All Hubs)',
};

export const DONOR_ORGANIZATIONS: DonorOrg[] = [
  { id: 'grand_hyatt', name: 'Grand Hyatt Central', sub: 'Commercial Kitchen #02', address: '109 E 42nd St, Midtown' },
  { id: 'metro_mart', name: 'Metro Mart Uptown', sub: 'Cold Storage Vault Bay A', address: '240 Amsterdam Ave, Upper West' },
  { id: 'bento_craft', name: 'Bento Craft Kitchen', sub: 'Executive Catering Line', address: '315 W 39th St, Garment District' },
  { id: 'harbor_bakery', name: 'Harbor Artisan Bakery', sub: 'Artisan Baking Floor', address: '55 Pier Street, Harbor District' },
  { id: 'green_grocers', name: 'Green Grocers Urban Market', sub: 'Wholesale Staging Bay 3', address: '812 Broadway, Flatiron' },
];

export const ALL_KITCHEN_OPTIONS: DonorOrg[] = [
  ALL_KITCHENS_ORG,
  ...DONOR_ORGANIZATIONS,
];

/**
 * Canonical Urgency Rule:
 * A donation is urgent if it is active (not delivered or cancelled)
 * and its safe handling window is <= 90 minutes remaining.
 */
export function isDonationUrgent(d: Donation): boolean {
  if (!d) return false;
  if (d.status === 'DELIVERED' || d.status === 'CANCELLED') return false;
  const minutes = typeof d.expiryMinutesRemaining === 'number'
    ? d.expiryMinutesRemaining
    : (typeof d.expiryHours === 'number'
      ? d.expiryHours * 60
      : 999);
  return minutes <= 90;
}

/**
 * Canonical Search Matcher:
 * Case-insensitive, whitespace-trimmed multi-field search:
 * lot ID, food title, donor name, donor kitchen ID, category, storageType,
 * packaging, allergens, dietaryTags, donor address/location, matched recipient.
 * Normalizes underscores/hyphens so "hot meals" matches "hot_meals".
 */
export function matchesDonationSearch(d: Donation, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  if (d.id.toLowerCase().includes(q)) return true;
  if (d.title.toLowerCase().includes(q)) return true;
  if (d.donorName.toLowerCase().includes(q)) return true;
  if (d.donorKitchenId?.toLowerCase().includes(q)) return true;
  
  // Category match with normalized spaces/underscores (e.g. "hot meals" matches "hot_meals")
  const normQ = q.replace(/[\s_-]+/g, ' ');
  const normCat = (d.category || '').toLowerCase().replace(/[\s_-]+/g, ' ');
  if (normCat.includes(normQ) || d.category.toLowerCase().includes(q)) return true;

  if (d.storageType.toLowerCase().includes(q)) return true;
  if (d.packaging?.toLowerCase().includes(q)) return true;
  if (d.donorAddress?.toLowerCase().includes(q)) return true;
  if (d.donorLocation?.toLowerCase().includes(q)) return true;
  if (d.allergens?.some(a => a.toLowerCase().includes(q))) return true;
  if (d.dietaryTags?.some(tag => tag.toLowerCase().includes(q))) return true;
  if (d.status.toLowerCase().includes(q)) return true;
  if (d.matchedRecipientId?.toLowerCase().includes(q)) return true;

  return false;
}

interface FoodLoopContextType {
  donations: Donation[];
  recipients: Recipient[];
  couriers: Courier[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  activeLotId: string;
  setActiveLotId: (id: string) => void;
  activeLot: Donation | undefined;
  toasts: ToastMessage[];
  triggerToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterMode: 'all' | 'urgent' | 'active';
  setFilterMode: (m: 'all' | 'urgent' | 'active') => void;
  allZonesActive: boolean;
  setAllZonesActive: (active: boolean) => void;
  toggleAllZones: () => void;
  isUrgentOnly: boolean;
  setIsUrgentOnly: (urgent: boolean) => void;
  toggleUrgentOnly: () => void;
  clearAllFilters: () => void;
  selectedKitchenId: string;
  setSelectedKitchenId: (id: string) => void;
  selectedDonorOrg: DonorOrg;
  setSelectedDonorOrg: (org: DonorOrg) => void;
  aiStatus: AiBackendStatus;
  refreshAiStatus: () => Promise<void>;
  recordAiInferenceResult: (isLive: boolean, apiError?: string) => void;
  addDonation: (newDonation: Omit<Donation, 'id' | 'createdAt' | 'status' | 'trackingSteps' | 'tempTelemetry'>) => Donation;
  assignMatch: (donationId: string, recipientId: string) => boolean;
  approvePlan: (donationId: string, courierId?: string) => boolean;
  rejectPlan: (donationId: string, reason: string) => void;
  updateDonationStatus: (donationId: string, status: DonationStatus, note?: string) => void;
  advanceDeliveryMilestone: (donationId: string, nextMilestone: 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED', note?: string) => boolean;
  completeHandoff: (donationId: string, proof: ProofOfDelivery) => boolean;
  simulateTelemetryReading: (donationId: string) => TempReading | null;
  injectTelemetryReading: (donationId: string, tempC: number) => void;
  resetDemoData: () => void;
  isResetConfirmOpen: boolean;
  requestResetDemoData: () => void;
  confirmResetDemoData: () => void;
  cancelResetDemoData: () => void;
}

const STORAGE_KEY_DONATIONS = 'foodloop_donations_v2';
const STORAGE_KEY_RECIPIENTS = 'foodloop_recipients_v2';
const STORAGE_KEY_COURIERS = 'foodloop_couriers_v2';

function loadValidDonations(): Donation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DONATIONS);
    if (!saved) return INITIAL_DONATIONS;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id && parsed[0]?.status) {
      return parsed;
    }
    return INITIAL_DONATIONS;
  } catch {
    return INITIAL_DONATIONS;
  }
}

function loadValidRecipients(): Recipient[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECIPIENTS);
    if (!saved) return INITIAL_RECIPIENTS;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id && typeof parsed[0]?.capacityTotalKg === 'number') {
      return parsed;
    }
    return INITIAL_RECIPIENTS;
  } catch {
    return INITIAL_RECIPIENTS;
  }
}

export function pathToView(pathname: string): ActiveView {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/privacy-policy' || clean === '/privacy') return 'privacy';
  if (clean === '/terms' || clean === '/terms-conditions') return 'terms';
  if (clean === '/cookie-policy' || clean === '/cookies') return 'cookies';
  if (clean === '/accessibility' || clean === '/accessibility-statement') return 'accessibility';
  if (clean === '/create' || clean === '/create-donation') return 'create';
  if (clean === '/matching' || clean === '/recipient-matching') return 'matching';
  if (clean === '/planner' || clean === '/ai-dispatch-planner') return 'planner';
  if (clean === '/tracking' || clean === '/chain-of-custody') return 'tracking';
  if (clean === '/analytics' || clean === '/impact-analytics') return 'analytics';
  return 'dashboard';
}

export function viewToPath(view: ActiveView): string {
  switch (view) {
    case 'privacy':
      return '/privacy-policy';
    case 'terms':
      return '/terms';
    case 'cookies':
      return '/cookie-policy';
    case 'accessibility':
      return '/accessibility';
    case 'create':
      return '/create';
    case 'matching':
      return '/matching';
    case 'planner':
      return '/planner';
    case 'tracking':
      return '/tracking';
    case 'analytics':
      return '/analytics';
    case 'dashboard':
    default:
      return '/';
  }
}

const FoodLoopContext = createContext<FoodLoopContextType | undefined>(undefined);

export const FoodLoopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donations, setDonations] = useState<Donation[]>(loadValidDonations);
  const [recipients, setRecipients] = useState<Recipient[]>(loadValidRecipients);

  const [couriers] = useState<Courier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURIERS);
      return saved ? JSON.parse(saved) : INITIAL_COURIERS;
    } catch {
      return INITIAL_COURIERS;
    }
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const [activeView, _setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      return pathToView(window.location.pathname);
    }
    return 'dashboard';
  });

  const setActiveView = useCallback((view: ActiveView) => {
    _setActiveView(view);
    if (typeof window !== 'undefined') {
      const targetPath = viewToPath(view);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        _setActiveView(event.state.view);
      } else {
        _setActiveView(pathToView(window.location.pathname));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [activeLotId, setActiveLotId] = useState<string>('FD-892');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, _setFilterMode] = useState<'all' | 'urgent' | 'active'>('all');
  const [isUrgentOnly, setIsUrgentOnly] = useState<boolean>(false);
  
  const [selectedKitchenId, _setSelectedKitchenId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('foodloop_selected_kitchen_id');
      if (saved && (saved === ALL_KITCHENS_ID || DONOR_ORGANIZATIONS.some(o => o.id === saved))) {
        return saved;
      }
      const legacy = localStorage.getItem('foodloop_selected_donor_org');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed?.id && (parsed.id === ALL_KITCHENS_ID || DONOR_ORGANIZATIONS.some(o => o.id === parsed.id))) {
          return parsed.id;
        }
      }
    } catch {
      // fallback
    }
    return DONOR_ORGANIZATIONS[0].id;
  });

  const [allZonesActive, setAllZonesActive] = useState<boolean>(() => {
    return selectedKitchenId === ALL_KITCHENS_ID;
  });

  const setFilterMode = (m: 'all' | 'urgent' | 'active') => {
    _setFilterMode(m);
    if (m === 'urgent') {
      setIsUrgentOnly(true);
    } else {
      setIsUrgentOnly(false);
    }
  };

  const toggleAllZones = () => {
    setAllZonesActive(prev => !prev);
  };

  const toggleUrgentOnly = () => {
    setIsUrgentOnly(prev => {
      const next = !prev;
      _setFilterMode(next ? 'urgent' : 'all');
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setIsUrgentOnly(false);
    _setFilterMode('all');
    setAllZonesActive(selectedKitchenId === ALL_KITCHENS_ID);
  };

  const selectedDonorOrg: DonorOrg = 
    ALL_KITCHEN_OPTIONS.find(o => o.id === selectedKitchenId) || DONOR_ORGANIZATIONS[0];

  const setSelectedKitchenId = (id: string) => {
    const validId = (id === ALL_KITCHENS_ID || DONOR_ORGANIZATIONS.some(o => o.id === id))
      ? id
      : DONOR_ORGANIZATIONS[0].id;
    _setSelectedKitchenId(validId);
    if (validId === ALL_KITCHENS_ID) {
      setAllZonesActive(true);
    } else {
      setAllZonesActive(false);
    }
    try {
      localStorage.setItem('foodloop_selected_kitchen_id', validId);
    } catch {
      // ignore
    }
    // When switching to a specific kitchen, automatically sync activeLotId to a lot from that kitchen if present
    if (validId !== ALL_KITCHENS_ID) {
      const matchingLot = donations.find(d => 
        (d.donorKitchenId && d.donorKitchenId === validId) || 
        d.donorName.toLowerCase().includes(validId.replace('_', ' '))
      );
      if (matchingLot) {
        setActiveLotId(matchingLot.id);
      }
    }
  };

  const setSelectedDonorOrg = (org: DonorOrg) => {
    setSelectedKitchenId(org.id);
  };

  // AI Backend Status
  const [aiStatus, setAiStatus] = useState<AiBackendStatus>({
    configured: false,
    hasKey: false,
    provider: 'openrouter',
    isLiveVerified: false,
    model: 'nvidia/nemotron-3.5-lightning:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    mode: 'deterministic_fallback_simulation',
  });

  const refreshAiStatus = async () => {
    const status = await getAiBackendStatus();
    setAiStatus(prev => ({
      ...status,
      // preserve live verification if verified
      isLiveVerified: prev.isLiveVerified && status.hasKey,
    }));
  };

  const recordAiInferenceResult = (isLive: boolean, apiError?: string) => {
    setAiStatus(prev => ({
      ...prev,
      isLiveVerified: isLive,
      lastError: apiError,
    }));
  };

  useEffect(() => {
    refreshAiStatus();
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    } catch (e) {
      console.warn('Failed saving donations to localStorage', e);
    }
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECIPIENTS, JSON.stringify(recipients));
    } catch (e) {
      console.warn('Failed saving recipients to localStorage', e);
    }
  }, [recipients]);

  const activeLot = donations.find(d => d.id === activeLotId) || donations[0];

  const triggerToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addDonation = (input: Omit<Donation, 'id' | 'createdAt' | 'status' | 'trackingSteps' | 'tempTelemetry'>): Donation => {
    // Generate clean, strictly unique sequential ID
    const existingNums = donations.map(d => {
      const match = d.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 890;
    });
    const nextNum = Math.max(...existingNums, 890) + 1;
    const newId = `FD-${nextNum}`;
    const targetKitchenId = input.donorKitchenId || (selectedKitchenId !== ALL_KITCHENS_ID ? selectedKitchenId : 'grand_hyatt');
    const matchedOrg = DONOR_ORGANIZATIONS.find(o => o.id === targetKitchenId);

    const newDonation: Donation = {
      ...input,
      id: newId,
      donorKitchenId: targetKitchenId,
      donorName: input.donorName || matchedOrg?.name || 'Grand Hyatt Central',
      donorLocation: input.donorLocation || matchedOrg?.sub || 'Commercial Kitchen #02',
      donorAddress: input.donorAddress || matchedOrg?.address || '109 E 42nd St, Midtown',
      createdAt: new Date().toISOString(),
      status: 'PUBLISHED',
      trackingSteps: [
        { title: 'Surplus Declared', timestamp: 'Just now', completed: true, active: false, details: `Logged by ${input.donorName}` },
        { title: 'Deterministic Match Matrix', timestamp: 'Active', completed: false, active: true, details: 'Evaluating recipient capacities' },
        { title: 'AI Route Proposal', timestamp: 'Pending', completed: false, active: false },
        { title: 'Courier Dispatch', timestamp: 'Pending', completed: false, active: false },
        { title: 'Chain of Custody Transit', timestamp: 'Pending', completed: false, active: false },
        { title: 'Recipient Acceptance', timestamp: 'Pending', completed: false, active: false },
      ],
      tempTelemetry: [
        { time: 'Just now', tempC: input.tempTargetC, status: 'safe' }
      ]
    };

    setDonations(prev => [newDonation, ...prev]);
    setActiveLotId(newId);
    triggerToast('Surplus Published', `${newId} (${input.title}) added to live operations matrix.`);
    return newDonation;
  };

  // Deterministic Assignment with strict safety constraint enforcement
  const assignMatch = (donationId: string, recipientId: string): boolean => {
    const targetDonation = donations.find(d => d.id === donationId);
    const targetRecipient = recipients.find(r => r.id === recipientId);

    if (!targetDonation || !targetRecipient) {
      triggerToast('Error', 'Invalid donation or recipient ID', 'alert');
      return false;
    }

    // STRICT SAFETY CHECK: AI and operator cannot bypass hard constraints
    const evaluation = evaluateRecipientConstraints(targetDonation, targetRecipient);
    if (!evaluation.eligible) {
      const mainReason = evaluation.rejectionReasons[0] || 'Violates physical or food-safety rules';
      triggerToast('Safety Constraint Violation', mainReason, 'alert');
      return false;
    }

    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      const updatedSteps = [...d.trackingSteps];
      if (updatedSteps[1]) {
        updatedSteps[1].completed = true;
        updatedSteps[1].active = false;
        updatedSteps[1].details = `Matched to ${targetRecipient.name}`;
      }
      if (updatedSteps[2]) {
        updatedSteps[2].active = true;
      }
      return {
        ...d,
        matchedRecipientId: recipientId,
        status: 'MATCHED' as DonationStatus,
        trackingSteps: updatedSteps,
      };
    }));

    triggerToast('Recipient Matched', `Assigned to ${targetRecipient.name}. Constraints verified: ${evaluation.score.toFixed(1)}% match.`);
    return true;
  };

  // Human approval of plan with safety verification
  const approvePlan = (donationId: string, courierId: string = 'COU-02'): boolean => {
    const targetDonation = donations.find(d => d.id === donationId);
    if (!targetDonation || !targetDonation.matchedRecipientId) {
      triggerToast('Approval Failed', 'No recipient matched to this lot.', 'alert');
      return false;
    }

    const targetRecipient = recipients.find(r => r.id === targetDonation.matchedRecipientId);
    if (!targetRecipient) {
      triggerToast('Approval Failed', 'Matched recipient not found.', 'alert');
      return false;
    }

    // Re-verify deterministic constraints
    const evaluation = evaluateRecipientConstraints(targetDonation, targetRecipient);
    if (!evaluation.eligible) {
      triggerToast('Safety Failure', `Cannot approve: ${evaluation.rejectionReasons[0]}`, 'alert');
      return false;
    }

    const targetCourier = couriers.find(c => c.id === courierId) || couriers[1];
    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      const updatedSteps = d.trackingSteps.map((step, idx) => {
        if (idx <= 2) return { ...step, completed: true, active: false };
        if (idx === 3) return { ...step, active: true, details: `${targetCourier.name} dispatched` };
        return step;
      });
      return {
        ...d,
        status: 'APPROVED' as DonationStatus,
        assignedCourierId: courierId,
        trackingSteps: updatedSteps,
      };
    }));

    triggerToast('Plan Authorized', `AI coordination plan approved. ${targetCourier.name} assigned.`);
    return true;
  };

  const rejectPlan = (donationId: string, reason: string) => {
    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      const updatedSteps = [...d.trackingSteps];
      if (updatedSteps[1]) {
        updatedSteps[1].completed = false;
        updatedSteps[1].active = true;
        updatedSteps[1].details = 'Awaiting alternative matching';
      }
      return {
        ...d,
        status: 'PUBLISHED' as DonationStatus,
        matchedRecipientId: undefined,
        assignedCourierId: undefined,
        notes: (d.notes ? `${d.notes}\n` : '') + `[Plan Rejected by Operator]: ${reason}`,
        trackingSteps: updatedSteps,
      };
    }));
    triggerToast('Plan Rejected', `Lot returned to matching pool: ${reason}`, 'warning');
  };

  const updateDonationStatus = (donationId: string, nextStatus: DonationStatus, note?: string) => {
    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      const updatedSteps = [...d.trackingSteps];
      if (nextStatus === 'PICKED_UP') {
        if (updatedSteps[3]) { updatedSteps[3].completed = true; updatedSteps[3].active = false; }
        if (updatedSteps[4]) { updatedSteps[4].active = true; }
      } else if (nextStatus === 'IN_TRANSIT') {
        if (updatedSteps[4]) { updatedSteps[4].active = true; }
      } else if (nextStatus === 'DELIVERED') {
        updatedSteps.forEach(s => { s.completed = true; s.active = false; });
      }
      return {
        ...d,
        status: nextStatus,
        trackingSteps: updatedSteps,
        notes: note ? (d.notes ? `${d.notes}\n${note}` : note) : d.notes,
      };
    }));
    triggerToast('Status Updated', `${donationId} transitioned to ${nextStatus}.`);
  };

  const advanceDeliveryMilestone = (
    donationId: string,
    nextMilestone: 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED',
    note?: string
  ): boolean => {
    const target = donations.find(d => d.id === donationId);
    if (!target) {
      triggerToast('Error', 'Donation lot not found.', 'alert');
      return false;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isoString = now.toISOString();

    // 1. Validate state transitions & prevent duplicate milestones
    if (nextMilestone === 'PICKED_UP') {
      if (target.status === 'PICKED_UP' || target.status === 'IN_TRANSIT' || target.status === 'ARRIVED' || target.status === 'DELIVERED') {
        triggerToast('Duplicate Milestone', `${target.id} has already been picked up from the donor dock.`, 'warning');
        return false;
      }
      if (target.status !== 'APPROVED' && target.status !== 'COURIER_ASSIGNED') {
        triggerToast('Invalid Transition', `Cannot pick up lot: status is ${target.status}. AI dispatch approval required first.`, 'alert');
        return false;
      }
    } else if (nextMilestone === 'IN_TRANSIT') {
      if (target.status === 'IN_TRANSIT' || target.status === 'ARRIVED' || target.status === 'DELIVERED') {
        triggerToast('Duplicate Milestone', `${target.id} is already in transit or arrived.`, 'warning');
        return false;
      }
      if (target.status !== 'PICKED_UP') {
        triggerToast('Invalid Transition', `Cannot depart in-transit: lot has not been picked up from donor dock.`, 'alert');
        return false;
      }
    } else if (nextMilestone === 'ARRIVED') {
      if (target.status === 'ARRIVED' || target.status === 'DELIVERED') {
        triggerToast('Duplicate Milestone', `${target.id} has already arrived at the recipient facility.`, 'warning');
        return false;
      }
      if (target.status !== 'IN_TRANSIT') {
        triggerToast('Invalid Transition', `Cannot confirm arrival: lot must be in-transit first.`, 'alert');
        return false;
      }
    }

    // 2. Perform state transition and record chronological event
    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;

      const courier = couriers.find(c => c.id === d.assignedCourierId) || couriers[1];
      const recipient = recipients.find(r => r.id === d.matchedRecipientId) || recipients[0];

      let updatedSteps = [...d.trackingSteps];
      const newTelemetryReading = generateSimulatedTelemetrySample(d.storageType, d.tempTelemetry);
      const updatedTelemetry = [...d.tempTelemetry, newTelemetryReading];

      if (nextMilestone === 'PICKED_UP') {
        updatedSteps = updatedSteps.map((s, idx) => {
          if (idx <= 3) return { ...s, completed: true, active: false };
          if (idx === 4) return { ...s, active: true, details: `Picked up by ${courier.name}. En route to ${recipient.name}.` };
          return s;
        });

        const pickupStepIndex = updatedSteps.findIndex(s => s.title.toLowerCase().includes('pickup') || s.title.toLowerCase().includes('picked up'));
        if (pickupStepIndex >= 0) {
          updatedSteps[pickupStepIndex] = {
            ...updatedSteps[pickupStepIndex],
            title: 'Dock Pickup Confirmed',
            timestamp: timeFormatted,
            isoTime: isoString,
            completed: true,
            active: false,
            details: `Courier ${courier.name} loaded totes at ${d.donorName} dock. Loading core temp: ${newTelemetryReading.tempC}°C.`,
          };
        }
      } else if (nextMilestone === 'IN_TRANSIT') {
        updatedSteps = updatedSteps.map((s, idx) => {
          if (idx <= 3) return { ...s, completed: true, active: false };
          if (idx === 4) return { ...s, active: true, details: `Active transit along corridor to ${recipient.name}.` };
          return s;
        });
        const transitStepIndex = updatedSteps.findIndex(s => s.title.toLowerCase().includes('route') || s.title.toLowerCase().includes('transit'));
        if (transitStepIndex >= 0) {
          updatedSteps[transitStepIndex] = {
            ...updatedSteps[transitStepIndex],
            title: 'Chain of Custody Active Transit',
            timestamp: timeFormatted,
            isoTime: isoString,
            completed: false,
            active: true,
            details: `Thermal profile verified in ${courier.vehiclePlate}. Transit corridor underway.`,
          };
        }
      } else if (nextMilestone === 'ARRIVED') {
        updatedSteps = updatedSteps.map((s, idx) => {
          if (idx <= 4) return { ...s, completed: true, active: false };
          if (idx === 5) return { ...s, active: true, details: `Arrived at ${recipient.name}. Ready for receiver intake inspection.` };
          return s;
        });
        const arrivalStepIndex = updatedSteps.findIndex(s => s.title.toLowerCase().includes('arrival') || s.title.toLowerCase().includes('arrived'));
        if (arrivalStepIndex >= 0) {
          updatedSteps[arrivalStepIndex] = {
            ...updatedSteps[arrivalStepIndex],
            title: 'Arrived at Recipient Facility',
            timestamp: timeFormatted,
            isoTime: isoString,
            completed: true,
            active: false,
            details: `Vehicle arrived at ${recipient.name} intake dock (${recipient.address}).`,
          };
        } else {
          updatedSteps.splice(updatedSteps.length - 1, 0, {
            title: 'Arrived at Recipient Facility',
            timestamp: timeFormatted,
            isoTime: isoString,
            completed: true,
            active: false,
            details: `Vehicle arrived at ${recipient.name} intake dock (${recipient.address}).`,
          });
        }
      }

      return {
        ...d,
        status: nextMilestone,
        trackingSteps: updatedSteps,
        tempTelemetry: updatedTelemetry,
        notes: note ? (d.notes ? `${d.notes}\n${note}` : note) : d.notes,
      };
    }));

    triggerToast('Milestone Recorded', `${donationId} advanced to ${nextMilestone.replace('_', ' ')}. Timestamp: ${timeFormatted}`);
    return true;
  };

  const simulateTelemetryReading = (donationId: string): TempReading | null => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return null;

    const newReading = generateSimulatedTelemetrySample(target.storageType, target.tempTelemetry);
    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        tempTelemetry: [...d.tempTelemetry, newReading],
      };
    }));

    const safety = evaluateThermalSafety(newReading, target.storageType);
    if (safety.violatesThreshold) {
      triggerToast('Thermal Alert', safety.message, 'alert');
    } else {
      triggerToast('Telemetry Sampled', `Simulated probe: ${newReading.tempC}°C at ${newReading.time}. Compliant with HACCP.`);
    }
    return newReading;
  };

  const injectTelemetryReading = (donationId: string, tempC: number) => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return;

    const now = new Date();
    const safety = evaluateThermalSafety(
      { time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), tempC, status: 'safe', isSimulated: true },
      target.storageType
    );

    const newReading: TempReading = {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      tempC,
      status: safety.status === 'safe' ? 'safe' : safety.status === 'warning' ? 'warning' : 'critical',
      isSimulated: true,
      notes: 'Injected test telemetry reading',
    };

    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        tempTelemetry: [...d.tempTelemetry, newReading],
      };
    }));

    if (safety.violatesThreshold) {
      triggerToast('Thermal Alert', safety.message, 'alert');
    } else {
      triggerToast('Telemetry Injected', `Injected sample: ${tempC}°C recorded.`);
    }
  };

  const completeHandoff = (donationId: string, proof: ProofOfDelivery): boolean => {
    const targetDonation = donations.find(d => d.id === donationId);
    if (!targetDonation) {
      triggerToast('Error', 'Donation not found.', 'alert');
      return false;
    }

    if (targetDonation.status === 'DELIVERED') {
      triggerToast('Already Finalized', `${donationId} has already completed delivery intake.`, 'info');
      return false;
    }

    // Must be in active transit/arrival stages
    if (targetDonation.status !== 'ARRIVED' && targetDonation.status !== 'IN_TRANSIT' && targetDonation.status !== 'PICKED_UP') {
      triggerToast('Invalid State', `Cannot complete handoff: lot must arrive at recipient facility first (current: ${targetDonation.status}).`, 'alert');
      return false;
    }

    // Evaluate thermal safety of intake temperature
    const safetyCheck = evaluateThermalSafety(
      { time: 'At Handoff', tempC: proof.handoffTempC, status: 'safe', isSimulated: true },
      targetDonation.storageType
    );

    if (safetyCheck.status === 'critical') {
      triggerToast('HACCP Safety Lockout', `Cannot finalize handoff: ${safetyCheck.message}`, 'alert');
      return false;
    }

    const now = new Date();
    const timeFormatted = proof.signatureDate || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isoString = now.toISOString();

    setDonations(prev => prev.map(d => {
      if (d.id !== donationId) return d;
      const updatedSteps = d.trackingSteps.map(s => ({
        ...s,
        completed: true,
        active: false,
      }));

      const finalStepIdx = updatedSteps.length - 1;
      if (finalStepIdx >= 0) {
        updatedSteps[finalStepIdx] = {
          ...updatedSteps[finalStepIdx],
          title: 'Recipient Acceptance & Digital Handoff',
          timestamp: timeFormatted,
          isoTime: isoString,
          completed: true,
          active: false,
          details: `Accepted by ${proof.recipientSignee}. Core temp verified at ${proof.handoffTempC}°C.`,
        };
      }

      const newTelemetry = [...d.tempTelemetry, {
        time: timeFormatted,
        timestamp: now.getTime(),
        tempC: proof.handoffTempC,
        status: safetyCheck.status === 'safe' ? 'safe' as const : 'warning' as const,
        isSimulated: true,
        notes: `Dock intake temperature certified by ${proof.recipientSignee}`,
      }];

      return {
        ...d,
        status: 'DELIVERED' as DonationStatus,
        trackingSteps: updatedSteps,
        tempTelemetry: newTelemetry,
        proofOfDelivery: proof,
      };
    }));

    // Update recipient intake capacity
    if (targetDonation.matchedRecipientId) {
      setRecipients(prev => prev.map(r => {
        if (r.id !== targetDonation.matchedRecipientId) return r;
        const newUsed = Math.min(r.capacityTotalKg, r.capacityUsedKg + targetDonation.quantityKg);
        return {
          ...r,
          capacityUsedKg: newUsed,
        };
      }));
    }

    triggerToast('Delivery Finalized', `Handoff verified by ${proof.recipientSignee} (${proof.handoffTempC}°C). ESG registry updated.`);
    return true;
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_DONATIONS);
    localStorage.removeItem(STORAGE_KEY_RECIPIENTS);
    localStorage.removeItem(STORAGE_KEY_COURIERS);
    localStorage.removeItem('foodloop_selected_kitchen_id');
    localStorage.removeItem('foodloop_selected_donor_org');
    setDonations(INITIAL_DONATIONS);
    setRecipients(INITIAL_RECIPIENTS);
    setActiveLotId('FD-892');
    setActiveView('dashboard');
    _setSelectedKitchenId(DONOR_ORGANIZATIONS[0].id);
    triggerToast('Demo State Reset', 'Platform restored to initial sample dataset with illustrative records.');
  };

  const requestResetDemoData = () => {
    setIsResetConfirmOpen(true);
  };

  const cancelResetDemoData = () => {
    setIsResetConfirmOpen(false);
  };

  const confirmResetDemoData = () => {
    setIsResetConfirmOpen(false);
    resetDemoData();
  };

  return (
    <FoodLoopContext.Provider
      value={{
        donations,
        recipients,
        couriers,
        activeView,
        setActiveView,
        activeLotId,
        setActiveLotId,
        activeLot,
        toasts,
        triggerToast,
        dismissToast,
        searchQuery,
        setSearchQuery,
        filterMode,
        setFilterMode,
        allZonesActive,
        setAllZonesActive,
        toggleAllZones,
        isUrgentOnly,
        setIsUrgentOnly,
        toggleUrgentOnly,
        clearAllFilters,
        selectedKitchenId,
        setSelectedKitchenId,
        selectedDonorOrg,
        setSelectedDonorOrg,
        aiStatus,
        refreshAiStatus,
        recordAiInferenceResult,
        addDonation,
        assignMatch,
        approvePlan,
        rejectPlan,
        updateDonationStatus,
        advanceDeliveryMilestone,
        completeHandoff,
        simulateTelemetryReading,
        injectTelemetryReading,
        resetDemoData,
        isResetConfirmOpen,
        requestResetDemoData,
        confirmResetDemoData,
        cancelResetDemoData,
      }}
    >
      {children}
    </FoodLoopContext.Provider>
  );
};

export const useFoodLoop = (): FoodLoopContextType => {
  const context = useContext(FoodLoopContext);
  if (!context) {
    throw new Error('useFoodLoop must be used within a FoodLoopProvider');
  }
  return context;
};
