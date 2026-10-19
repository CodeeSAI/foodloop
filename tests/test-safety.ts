import { evaluateRecipientConstraints } from '../src/utils/constraintEngine';
import { INITIAL_RECIPIENTS } from '../src/data/seedData';
import { Donation } from '../src/types';

console.log('=== TEST 1: Deterministic Constraint Safety Rules ===');

// Create test donation: 45kg Hot Meals with Peanuts & Gluten
const testDonation: Donation = {
  id: 'TEST-001',
  title: 'Spicy Peanut Chicken Buffet Trays',
  category: 'hot_meals',
  donorName: 'Grand Hyatt Central',
  donorLocation: 'Commercial Kitchen #02',
  donorAddress: '109 E 42nd St',
  quantityKg: 45,
  servings: 120,
  packaging: 'Insulated Cambro Thermal Totes',
  storageType: 'hot',
  tempTargetC: 65,
  cookedOrPackedAt: 'Today, 2:00 PM',
  expiryDeadline: 'Today, 4:30 PM',
  expiryMinutesRemaining: 150,
  allergens: ['Peanuts', 'Gluten (Wheat)'],
  dietaryTags: ['Halal Poultry'],
  status: 'PUBLISHED',
  pickupWindow: '2:30 PM – 3:00 PM',
  trackingSteps: [],
  tempTelemetry: [],
  createdAt: new Date().toISOString(),
};

INITIAL_RECIPIENTS.forEach(rec => {
  const result = evaluateRecipientConstraints(testDonation, rec);
  console.log(`\nShelter: ${rec.name} (${rec.type})`);
  console.log(`  Capacity: ${rec.capacityUsedKg}/${rec.capacityTotalKg}kg (${rec.capacityTotalKg - rec.capacityUsedKg}kg free)`);
  console.log(`  Eligible: ${result.eligible} | Score: ${result.score.toFixed(1)}%`);
  if (!result.eligible) {
    console.log(`  REJECTED REASONS:`);
    result.rejectionReasons.forEach(r => console.log(`   - ${r}`));
  } else {
    console.log(`  APPROVED HIGHLIGHTS:`);
    result.positiveHighlights.forEach(h => console.log(`   + ${h}`));
  }
});

console.log('\n=== TEST 2: Allergen Clash Verification ===');
const youthPantry = INITIAL_RECIPIENTS.find(r => r.id === 'REC-04')!;
const peanutEval = evaluateRecipientConstraints(testDonation, youthPantry);
if (!peanutEval.eligible && peanutEval.breakdown.allergens.passed === false) {
  console.log('PASS: Harbor Youth Pantry correctly rejected due to Peanuts allergen mandate!');
} else {
  console.error('FAIL: Harbor Youth Pantry should have rejected peanuts!');
  process.exit(1);
}

console.log('\n=== TEST 3: Capacity Overflow Verification ===');
const cityShelter = INITIAL_RECIPIENTS.find(r => r.id === 'REC-03')!; // only 30kg left
const capacityEval = evaluateRecipientConstraints(testDonation, cityShelter);
if (!capacityEval.eligible && capacityEval.breakdown.capacity.passed === false) {
  console.log('PASS: City Shelter East correctly rejected due to capacity limit (30kg left vs 45kg required)!');
} else {
  console.error('FAIL: City Shelter East should have rejected capacity overflow!');
  process.exit(1);
}

console.log('\nAll deterministic safety rule tests PASSED successfully.');
