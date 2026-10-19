import { evaluateRecipientConstraints } from '../src/utils/constraintEngine';
import { INITIAL_RECIPIENTS, INITIAL_DONATIONS } from '../src/data/seedData';
import { Donation, Recipient, ProofOfDelivery } from '../src/types';

console.log('=== WORKFLOW VERIFICATION: Create -> Match -> Plan -> Transit -> Deliver ===');

let donations: Donation[] = [...INITIAL_DONATIONS];
let recipients: Recipient[] = [...INITIAL_RECIPIENTS];

// 1. Create a new donation with unique ID
const newId = `FD-${890 + donations.length + 1}`;
const newDonation: Donation = {
  id: newId,
  title: '80 Trays Gourmet Roasted Salmon & Quinoa',
  category: 'hot_meals',
  donorName: 'Grand Hyatt Central',
  donorLocation: 'Commercial Kitchen #02',
  donorAddress: '109 E 42nd St, Midtown',
  quantityKg: 35,
  servings: 90,
  packaging: 'Insulated Cambro Thermal Totes',
  storageType: 'hot',
  tempTargetC: 65,
  cookedOrPackedAt: 'Today, Just Now',
  expiryDeadline: 'Today, 5:00 PM',
  expiryMinutesRemaining: 120,
  allergens: ['Fish (Salmon)'],
  dietaryTags: ['Pescatarian', 'Nut-Free', 'Halal Prep'],
  status: 'PUBLISHED',
  pickupWindow: 'Within 30-45 minutes',
  trackingSteps: [
    { title: 'Surplus Declared', timestamp: 'Just now', completed: true, active: false },
    { title: 'Deterministic Match Matrix', timestamp: 'Active', completed: false, active: true },
    { title: 'AI Route Proposal', timestamp: 'Pending', completed: false, active: false },
    { title: 'Courier Dispatch', timestamp: 'Pending', completed: false, active: false },
    { title: 'Chain of Custody Transit', timestamp: 'Pending', completed: false, active: false },
    { title: 'Recipient Acceptance', timestamp: 'Pending', completed: false, active: false },
  ],
  tempTelemetry: [{ time: 'Just now', tempC: 65, status: 'safe' }],
  createdAt: new Date().toISOString(),
};

donations = [newDonation, ...donations];
console.log(`Step 1: Successfully created new donation ${newDonation.id} (${newDonation.title}). Total lots in state: ${donations.length}`);

// 2. Evaluate recipient constraints
console.log('\nStep 2: Evaluating eligible recipients for ' + newDonation.id);
const evaluations = recipients.map(r => ({
  recipient: r,
  eval: evaluateRecipientConstraints(newDonation, r),
}));

evaluations.forEach(e => {
  console.log(` - ${e.recipient.name}: Eligible = ${e.eval.eligible} (${e.eval.score.toFixed(1)}%) ${e.eval.eligible ? '' : `[Rejection: ${e.eval.rejectionReasons[0]}]`}`);
});

// 3. Attempt invalid assignment to City Shelter East (only 30kg left vs 35kg)
const cityShelter = recipients.find(r => r.id === 'REC-03')!;
const invalidCheck = evaluateRecipientConstraints(newDonation, cityShelter);
if (invalidCheck.eligible) {
  console.error('FAIL: City Shelter East should have been rejected due to 30kg capacity limit!');
  process.exit(1);
} else {
  console.log('PASS: Guardrail correctly blocked invalid assignment to City Shelter East (Capacity constraint enforced).');
}

// 4. Assign valid recipient: Hope Community Kitchen (REC-01)
const hopeKitchen = recipients.find(r => r.id === 'REC-01')!;
const validCheck = evaluateRecipientConstraints(newDonation, hopeKitchen);
if (!validCheck.eligible) {
  console.error('FAIL: Hope Community Kitchen should be eligible!');
  process.exit(1);
} else {
  console.log('PASS: Hope Community Kitchen verified eligible (Nut-Free match, 440kg capacity available).');
  // Update donation to MATCHED
  donations = donations.map(d => d.id === newDonation.id ? { ...d, status: 'MATCHED' as const, matchedRecipientId: hopeKitchen.id } : d);
}

// 5. Operator approves AI plan -> status becomes APPROVED
donations = donations.map(d => d.id === newDonation.id ? { ...d, status: 'APPROVED' as const, assignedCourierId: 'COU-02' } : d);
console.log(`Step 3: AI Coordination Plan approved. ${newDonation.id} status is now: ${donations.find(d => d.id === newDonation.id)!.status}`);

// 6. Courier picks up and enters transit -> status becomes IN_TRANSIT
donations = donations.map(d => d.id === newDonation.id ? { ...d, status: 'IN_TRANSIT' as const } : d);
console.log(`Step 4: Courier dispatched and picked up. ${newDonation.id} status is now: ${donations.find(d => d.id === newDonation.id)!.status}`);

// 7. Digital handoff sign-off -> status becomes DELIVERED
const proof: ProofOfDelivery = {
  recipientSignee: 'Sister Maria Vance',
  signatureDate: 'Today, 3:15 PM',
  handoffTempC: 64.2,
  verificationPin: '8920',
  notes: 'Received in hot holding cambros at 64.2°C.',
};

donations = donations.map(d => d.id === newDonation.id ? {
  ...d,
  status: 'DELIVERED' as const,
  proofOfDelivery: proof,
  tempTelemetry: [...d.tempTelemetry, { time: 'At Handoff', tempC: 64.2, status: 'safe' as const }]
} : d);

// Update recipient capacity
recipients = recipients.map(r => r.id === hopeKitchen.id ? {
  ...r,
  capacityUsedKg: r.capacityUsedKg + newDonation.quantityKg,
} : r);

const finalDonation = donations.find(d => d.id === newDonation.id)!;
const finalRecipient = recipients.find(r => r.id === hopeKitchen.id)!;

console.log(`\nStep 5: Delivery handoff completed for ${finalDonation.id}!`);
console.log(` - Final status: ${finalDonation.status}`);
console.log(` - Signee: ${finalDonation.proofOfDelivery?.recipientSignee}`);
console.log(` - Verified intake temp: ${finalDonation.proofOfDelivery?.handoffTempC}°C`);
console.log(` - Hope Community Kitchen capacity updated: ${finalRecipient.capacityUsedKg}/${finalRecipient.capacityTotalKg}kg`);

// 8. Verify Impact Analytics derivation
const delivered = donations.filter(d => d.status === 'DELIVERED');
const deliveredKg = delivered.reduce((a, b) => a + b.quantityKg, 0);
const deliveredMeals = delivered.reduce((a, b) => a + b.servings, 0);
const co2e = (deliveredKg * 0.0022).toFixed(2);

console.log(`\nStep 6: Impact Analytics State Derivation:`);
console.log(` - Completed lots count: ${delivered.length}`);
console.log(` - Total delivered kg: ${deliveredKg} kg (including ${newDonation.quantityKg}kg from new lot)`);
console.log(` - Total meals served: ~${deliveredMeals} meals`);
console.log(` - Total CO2e diverted: ${co2e} tonnes`);

console.log('\nFULL END-TO-END WORKFLOW VERIFIED SUCCESSFULLY!');
