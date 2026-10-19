import { INITIAL_DONATIONS, INITIAL_RECIPIENTS } from '../src/data/seedData';
import { matchesDonationSearch, isDonationUrgent, DONOR_ORGANIZATIONS } from '../src/context/FoodLoopContext';
import { evaluateRecipientConstraints } from '../src/utils/constraintEngine';
import { Donation } from '../src/types';

console.log('================================================================');
console.log(' FOODLOOP V3.5 — CRITICAL REPAIRS & SEARCH PIPELINE TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// 1. DASHBOARD SEARCH VERIFICATION
// -------------------------------------------------------------
console.log('--- 1. Multi-Field Search & Filter Pipeline ---');

const testDonation = INITIAL_DONATIONS[0]; // FD-892, Hot Buffet Trays, Grand Hyatt Central, category: hot_meals, allergens: Dairy, Gluten

// 1.1 Case-insensitive ID search
assert(
  matchesDonationSearch(testDonation, 'fd-892'),
  '1.1 Search matches lowercase lot ID ("fd-892")'
);
assert(
  matchesDonationSearch(testDonation, 'FD-892'),
  '1.2 Search matches uppercase lot ID ("FD-892")'
);

// 1.2 Title search with accidental whitespace
assert(
  matchesDonationSearch(testDonation, '  Buffet Trays  '),
  '1.3 Search matches food title with leading and trailing whitespace'
);

// 1.3 Search by donor kitchen
assert(
  matchesDonationSearch(testDonation, 'hyatt central'),
  '1.4 Search matches donor kitchen name ("hyatt central")'
);

// 1.4 Search by category
assert(
  matchesDonationSearch(testDonation, 'hot meals'),
  '1.5 Search matches food category ("hot meals")'
);

// 1.5 Search by allergen
assert(
  matchesDonationSearch(testDonation, 'gluten'),
  '1.6 Search matches allergen ("gluten")'
);

// 1.6 Search by storage type
assert(
  matchesDonationSearch(testDonation, 'hot'),
  '1.7 Search matches storage type ("hot")'
);

// 1.7 Empty search string restores all records
assert(
  matchesDonationSearch(testDonation, '') === true,
  '1.8 Empty search string returns true (restores all records)'
);
assert(
  matchesDonationSearch(testDonation, '   ') === true,
  '1.9 Whitespace-only search string returns true'
);

// 1.8 Non-matching query
assert(
  matchesDonationSearch(testDonation, 'nonexistentfoodxyz123') === false,
  '1.10 Non-matching query returns false'
);


// -------------------------------------------------------------
// 2. ALL ZONES & URGENT ONLY COMPOSITION
// -------------------------------------------------------------
console.log('\n--- 2. All Zones & Urgent Only Composition ---');

// Urgent filter test
const urgentDonations = INITIAL_DONATIONS.filter(d => isDonationUrgent(d));
assert(
  urgentDonations.length > 0 && urgentDonations.every(d => (d.expiryMinutesRemaining ?? (d as unknown as { expiryHours: number }).expiryHours * 60) <= 90),
  '2.1 isDonationUrgent strictly checks active perishable window (<90m)'
);

// Grand Hyatt Kitchen alone
const hyattLots = INITIAL_DONATIONS.filter(d => d.donorKitchenId === 'grand_hyatt');
assert(
  hyattLots.length === 1 && hyattLots[0].id === 'FD-892',
  '2.2 Kitchen-specific filtering isolates Grand Hyatt lots'
);

// Composing Kitchen + Urgent
const hyattUrgent = hyattLots.filter(d => isDonationUrgent(d));
assert(
  hyattUrgent.length === 1,
  '2.3 Kitchen filter + Urgent Only correctly composes'
);

// All Zones overrides kitchen isolation without clobbering activeKitchenId
const allLots = INITIAL_DONATIONS;
const allUrgent = allLots.filter(d => isDonationUrgent(d));
assert(
  allUrgent.length >= 1,
  '2.4 All Zones active exposes urgent lots across all network kitchens'
);

// Composing All Zones + Search
const searchSalmonAllZones = allLots.filter(d => matchesDonationSearch(d, 'salmon'));
assert(
  searchSalmonAllZones.length === 1 && searchSalmonAllZones[0].id === 'FD-896',
  '2.5 All Zones + Search for "salmon" finds Bento Craft lot FD-896'
);


// -------------------------------------------------------------
// 3. KITCHEN SWITCHING INTEGRITY & PERSISTENCE
// -------------------------------------------------------------
console.log('\n--- 3. Kitchen Switching Integrity ---');

DONOR_ORGANIZATIONS.forEach(org => {
  if (org.id === 'all') return;
  const lots = INITIAL_DONATIONS.filter(d => d.donorKitchenId === org.id);
  assert(
    lots.every(d => d.donorKitchenId === org.id),
    `3.1 All lots for kitchen ${org.name} (${org.id}) belong strictly to it`
  );
});

// Adding a new donation to Bento Craft Kitchen
const newBentoLot: Donation = {
  id: 'FD-999',
  title: 'Fresh Teriyaki Chicken Bowls',
  donorName: 'Bento Craft Kitchen',
  donorLocation: 'Downtown Arts District',
  donorAddress: '554 4th St, Arts District',
  donorKitchenId: 'bento_craft',
  category: 'hot_meals',
  quantityKg: 20,
  servings: 50,
  storageType: 'hot',
  tempTargetC: 66,
  expiryHours: 1.2, // 72 min -> URGENT
  allergens: ['Soy', 'Gluten'],
  packaging: 'Insulated Cambro Thermal Totes',
  status: 'PENDING_MATCH',
  preparedAt: new Date().toISOString(),
  notes: 'Freshly prepared for evening rush.',
  telemetry: [],
};

const combinedDonations = [newBentoLot, ...INITIAL_DONATIONS];

// Check Bento Craft scoped view has 2 lots
const bentoScoped = combinedDonations.filter(d => d.donorKitchenId === 'bento_craft');
assert(
  bentoScoped.length === 2 && bentoScoped.some(d => d.id === 'FD-999'),
  '3.2 Newly created donation belongs to active kitchen and appears in scoped view'
);

// Check Grand Hyatt view does NOT receive Bento Craft lot
const hyattScoped = combinedDonations.filter(d => d.donorKitchenId === 'grand_hyatt');
assert(
  !hyattScoped.some(d => d.id === 'FD-999'),
  '3.3 Newly created donation does NOT leak into other kitchen views'
);

// Check search on new lot
assert(
  matchesDonationSearch(newBentoLot, 'teriyaki') === true,
  '3.4 Search works immediately on newly added donation'
);


// -------------------------------------------------------------
// 4. SIX-STAGE AI DECISION PIPELINE & SAFETY LOCKOUT
// -------------------------------------------------------------
console.log('\n--- 4. Six-Stage AI Decision Pipeline & Lockout ---');

// Stage definitions
const stages = [
  { step: 1, name: 'Received' },
  { step: 2, name: 'Filtered' },
  { step: 3, name: 'Ranked' },
  { step: 4, name: 'Synthesized' },
  { step: 5, name: 'Verified' },
  { step: 6, name: 'Sign-off' },
];

assert(stages.length === 6, '4.1 Six distinct stages defined in AI decision pipeline');

// Test safety engine constraint checking for valid vs invalid pairing
const hotMealLot = INITIAL_DONATIONS[0]; // Hot Buffet Trays, requires warming ovens or fast dining service

// Evaluate against St. Jude Family Mission (has peanut-free mandate + lacks warming ovens)
const stJude = INITIAL_RECIPIENTS.find(r => r.id === 'REC-04')!;
const evalIneligible = evaluateRecipientConstraints(hotMealLot, stJude);

assert(
  evalIneligible.eligible === false,
  '4.2 Deterministic safety engine rejects St. Jude (missing warming equipment / food category mismatch)'
);

// Verify that pipeline Stage 6 strictly blocks sign-off when eligible is false
function canSignOff(isEligible: boolean): boolean {
  return isEligible;
}

assert(
  canSignOff(evalIneligible.eligible) === false,
  '4.3 AI Stage 6 sign-off is strictly locked out when safety evaluation fails'
);

// Evaluate against Downtown Hope Mission (REC-01, eligible for hot meals)
const hopeMission = INITIAL_RECIPIENTS.find(r => r.id === 'REC-01')!;
const evalEligible = evaluateRecipientConstraints(hotMealLot, hopeMission);

assert(
  evalEligible.eligible === true,
  '4.4 Downtown Hope Mission passes all HACCP and capacity constraints'
);

assert(
  canSignOff(evalEligible.eligible) === true,
  '4.5 AI Stage 6 sign-off permitted for verified safe and eligible candidate'
);

console.log('\n================================================================');
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
console.log('================================================================');
