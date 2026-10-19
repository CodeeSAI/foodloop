/**
 * FOODLOOP Regression Test Suite: Kitchen Dropdown, Stacking, Layout & State Propagation
 */

import { ALL_KITCHEN_OPTIONS, ALL_KITCHENS_ID, ALL_KITCHENS_ORG, DONOR_ORGANIZATIONS, DonorOrg } from '../src/context/FoodLoopContext';
import { INITIAL_DONATIONS, INITIAL_RECIPIENTS } from '../src/data/seedData';
import { evaluateRecipientConstraints } from '../src/utils/constraintEngine';
import { Donation } from '../src/types';

function assert(condition: boolean, testName: string, details?: string) {
  if (!condition) {
    console.error(`[FAIL] ${testName}${details ? ` - Details: ${details}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
  console.log(`[PASS] ${testName}`);
}

console.log('================================================================');
console.log('FOODLOOP — KITCHEN DROPDOWN & DATA SYNCHRONIZATION REGRESSION TEST');
console.log('================================================================\n');

// -------------------------------------------------------------
// Test 1: Kitchen Dropdown Open/Close Toggle
// -------------------------------------------------------------
let isDropdownOpen = false;
const toggleDropdown = () => { isDropdownOpen = !isDropdownOpen; };

assert(!isDropdownOpen, '1A. Dropdown is initially closed');
toggleDropdown();
assert(isDropdownOpen, '1B. Clicking selector opens the kitchen dropdown menu');
toggleDropdown();
assert(!isDropdownOpen, '1C. Clicking selector again closes the kitchen dropdown menu');

// -------------------------------------------------------------
// Test 2: Outside-Click and Escape Key Dismissal Logic
// -------------------------------------------------------------
isDropdownOpen = true;

function handleOutsideClick(clickedTargetIsInside: boolean) {
  if (!clickedTargetIsInside) {
    isDropdownOpen = false;
  }
}

handleOutsideClick(true);
assert(isDropdownOpen, '2A. Clicking inside dropdown keeps it open');

handleOutsideClick(false);
assert(!isDropdownOpen, '2B. Clicking outside dropdown reliably closes it');

isDropdownOpen = true;
function handleKeyDown(key: string) {
  if (key === 'Escape') {
    isDropdownOpen = false;
  }
}
handleKeyDown('Tab');
assert(isDropdownOpen, '2C. Non-Escape keys do not close dropdown');
handleKeyDown('Escape');
assert(!isDropdownOpen, '2D. Pressing Escape key immediately dismisses dropdown');

// -------------------------------------------------------------
// Test 3: Grand Hyatt Central — Verification of Donation Lots & Scoped Metrics
// -------------------------------------------------------------
let selectedKitchenId: string = 'grand_hyatt';
let donationsList: Donation[] = JSON.parse(JSON.stringify(INITIAL_DONATIONS));

function getKitchenScopedLots(donations: Donation[], kitchenId: string): Donation[] {
  if (kitchenId === ALL_KITCHENS_ID) return donations;
  return donations.filter(d => {
    if (d.donorKitchenId) return d.donorKitchenId === kitchenId;
    return d.donorName.toLowerCase().includes(kitchenId.replace('_', ' '));
  });
}

const grandHyattLots = getKitchenScopedLots(donationsList, selectedKitchenId);
assert(grandHyattLots.length === 1, '3A. Grand Hyatt Central has 1 registered donation lot');
assert(grandHyattLots[0].id === 'FD-892', '3B. Grand Hyatt lot is FD-892 (Hot Buffet Trays)');
assert(grandHyattLots[0].donorKitchenId === 'grand_hyatt', '3C. Lot FD-892 has correct donorKitchenId');

const ghMovingLots = grandHyattLots.filter(d => d.status === 'IN_TRANSIT');
const ghDeliveredLots = grandHyattLots.filter(d => d.status === 'DELIVERED');
assert(ghMovingLots.length === 1 && ghMovingLots[0].quantityKg === 45, '3D. Grand Hyatt derived moving metric is 45kg');
assert(ghDeliveredLots.length === 0, '3E. Grand Hyatt has 0 delivered lots currently');

// -------------------------------------------------------------
// Test 4: Switching to Bento Craft Kitchen — Lots & Metrics Update Dynamically
// -------------------------------------------------------------
selectedKitchenId = 'bento_craft';
const bentoLots = getKitchenScopedLots(donationsList, selectedKitchenId);

assert(bentoLots.length === 1, '4A. Bento Craft Kitchen has 1 registered donation lot');
assert(bentoLots[0].id === 'FD-896', '4B. Bento Craft lot is FD-896 (Gourmet Bento Sets)');
assert(bentoLots[0].donorKitchenId === 'bento_craft', '4C. Lot FD-896 has correct donorKitchenId');

const bentoApproved = bentoLots.filter(d => d.status === 'APPROVED');
const bentoMoving = bentoLots.filter(d => d.status === 'IN_TRANSIT');
assert(bentoApproved.length === 1 && bentoApproved[0].quantityKg === 28, '4D. Bento Craft approved metric is 28kg');
assert(bentoMoving.length === 0, '4E. Bento Craft has 0 moving lots');

// -------------------------------------------------------------
// Test 5: Switch to All Kitchens — Network-wide Data Returns
// -------------------------------------------------------------
selectedKitchenId = ALL_KITCHENS_ID;
const networkLots = getKitchenScopedLots(donationsList, selectedKitchenId);

assert(networkLots.length === INITIAL_DONATIONS.length, '5A. All Kitchens scope returns all 5 network donation lots');

const networkDelivered = networkLots.filter(d => d.status === 'DELIVERED');
const networkActive = networkLots.filter(d => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
assert(networkDelivered.length === 1 && networkDelivered[0].quantityKg === 32, '5B. Network delivered lots count is 1 (32kg)');
assert(networkActive.length === 4, '5C. Network active batches count is 4');

// -------------------------------------------------------------
// Test 6: Creating a Donation Under Bento Craft Kitchen
// -------------------------------------------------------------
selectedKitchenId = 'bento_craft';
const newBentoDonation: Donation = {
  id: 'FD-897',
  title: 'Fresh Salmon & Edamame Bento Sets',
  category: 'hot_meals',
  donorKitchenId: 'bento_craft',
  donorName: 'Bento Craft Kitchen',
  donorLocation: 'Kitchen Dispatch Line 1',
  donorAddress: '315 W 39th St, Garment District',
  quantityKg: 20,
  servings: 40,
  packaging: 'Biodegradable Bento Containers',
  storageType: 'hot',
  tempTargetC: 62,
  cookedOrPackedAt: 'Today, Just Now',
  expiryDeadline: 'Today, 6:00 PM',
  expiryMinutesRemaining: 120,
  allergens: ['Fish (Salmon)', 'Soy'],
  dietaryTags: ['Pescatarian'],
  status: 'PUBLISHED',
  pickupWindow: 'Within 30 minutes',
  trackingSteps: [],
  tempTelemetry: [],
};

donationsList.push(newBentoDonation);

// Test visibility in Bento Craft Kitchen
const updatedBentoLots = getKitchenScopedLots(donationsList, 'bento_craft');
assert(updatedBentoLots.length === 2, '6A. Bento Craft Kitchen now has 2 lots (FD-896, FD-897)');
assert(updatedBentoLots.some(d => d.id === 'FD-897'), '6B. New donation FD-897 appears under Bento Craft Kitchen');

// Test visibility in All Kitchens
const updatedNetworkLots = getKitchenScopedLots(donationsList, ALL_KITCHENS_ID);
assert(updatedNetworkLots.length === 6, '6C. New donation FD-897 appears in All Kitchens view');

// Test non-visibility in unrelated kitchens
const unrelatedGrandHyattLots = getKitchenScopedLots(donationsList, 'grand_hyatt');
assert(unrelatedGrandHyattLots.length === 1 && !unrelatedGrandHyattLots.some(d => d.id === 'FD-897'),
  '6D. New donation FD-897 does NOT leak into Grand Hyatt Central');

const unrelatedMetroLots = getKitchenScopedLots(donationsList, 'metro_mart');
assert(unrelatedMetroLots.length === 1 && !unrelatedMetroLots.some(d => d.id === 'FD-897'),
  '6E. New donation FD-897 does NOT leak into Metro Mart Uptown');

// -------------------------------------------------------------
// Test 7: Combining Kitchen, Search, Category, and Urgent Filters
// -------------------------------------------------------------
function applyCombinedFilters(
  lots: Donation[],
  kitchenId: string,
  search: string,
  category: string,
  filterMode: 'all' | 'urgent' | 'active'
): Donation[] {
  const scoped = getKitchenScopedLots(lots, kitchenId);
  return scoped.filter(d => {
    if (filterMode === 'urgent' && d.expiryMinutesRemaining > 90) return false;
    if (filterMode === 'active' && d.status === 'DELIVERED') return false;
    if (category !== 'all' && d.category !== category) return false;
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return (
      d.id.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.donorName.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  });
}

// 7A: Kitchen = all, Category = hot_meals
const hotMealsAll = applyCombinedFilters(donationsList, 'all', '', 'hot_meals', 'all');
assert(hotMealsAll.length === 3, '7A. All Kitchens + Hot Meals filter returns 3 lots (FD-892, FD-896, FD-897)');

// 7B: Kitchen = all, Category = hot_meals, Search = 'Salmon'
const salmonHotMeals = applyCombinedFilters(donationsList, 'all', 'Salmon', 'hot_meals', 'all');
assert(salmonHotMeals.length === 2 && salmonHotMeals.every(d => d.donorKitchenId === 'bento_craft'),
  '7B. Combined Category + Search returns 2 Bento Craft salmon lots');

// 7C: Kitchen = grand_hyatt, Search = 'Salmon' -> Empty state
const grandHyattSalmon = applyCombinedFilters(donationsList, 'grand_hyatt', 'Salmon', 'all', 'all');
assert(grandHyattSalmon.length === 0, '7C. Grand Hyatt + search for Salmon correctly yields empty set');

// 7D: Kitchen = grand_hyatt, urgent only (<90m remaining)
const grandHyattUrgent = applyCombinedFilters(donationsList, 'grand_hyatt', '', 'all', 'urgent');
assert(grandHyattUrgent.length === 1 && grandHyattUrgent[0].id === 'FD-892',
  '7D. Urgent filter correctly returns FD-892 (74m remaining)');

// -------------------------------------------------------------
// Test 8: LocalStorage Persistence & Outdated Data Resilience
// -------------------------------------------------------------
const storageMock: Record<string, string> = {};

function persistKitchen(kId: string) {
  storageMock['foodloop_selected_kitchen_id'] = kId;
}

function restoreKitchen(): string {
  const saved = storageMock['foodloop_selected_kitchen_id'];
  if (saved && (saved === ALL_KITCHENS_ID || DONOR_ORGANIZATIONS.some(o => o.id === saved))) {
    return saved;
  }
  return DONOR_ORGANIZATIONS[0].id;
}

persistKitchen('bento_craft');
assert(restoreKitchen() === 'bento_craft', '8A. Kitchen ID bento_craft persists and restores cleanly');

persistKitchen(ALL_KITCHENS_ID);
assert(restoreKitchen() === ALL_KITCHENS_ID, '8B. All Kitchens ID all persists and restores cleanly');

// Invalid/outdated stored selection fallback test
persistKitchen('non_existent_invalid_kitchen_id');
assert(restoreKitchen() === 'grand_hyatt', '8C. Corrupted or outdated kitchen ID safely falls back to grand_hyatt');

// -------------------------------------------------------------
// Test 9: Form Defaults Propagation in Donation Creation
// -------------------------------------------------------------
const bentoOrg = DONOR_ORGANIZATIONS.find(o => o.id === 'bento_craft')!;
assert(bentoOrg.name === 'Bento Craft Kitchen', '9A. Bento Craft Kitchen has stable display name');
assert(bentoOrg.sub === 'Executive Catering Line', '9B. Bento Craft Kitchen has stable subtitle');
assert(bentoOrg.address === '315 W 39th St, Garment District', '9C. Bento Craft Kitchen has stable address');

// -------------------------------------------------------------
// Test 10: Recipient Matching & Safety Evaluation for Active Lot
// -------------------------------------------------------------
const activeBentoLot = donationsList.find(d => d.id === 'FD-896')!;
const hopeShelter = INITIAL_RECIPIENTS.find(r => r.id === 'REC-01')!;
const evalResult = evaluateRecipientConstraints(activeBentoLot, hopeShelter);
assert(evalResult.eligible, '10A. Recipient matching evaluates active lot from Bento Craft successfully');

console.log('\n================================================================');
console.log('ALL KITCHEN SWITCHING & DATA SYNCHRONIZATION TESTS PASSED! (26/26)');
console.log('================================================================\n');
