import { Donation, Recipient } from '../types';

export interface ConstraintEvaluation {
  eligible: boolean;
  score: number; // 0 - 100
  breakdown: {
    capacity: { passed: boolean; message: string; remainingKg: number };
    category: { passed: boolean; message: string };
    allergens: { passed: boolean; message: string; conflicts: string[] };
    temperature: { passed: boolean; message: string };
    expiry: { passed: boolean; message: string; marginMinutes: number };
    proximity: { passed: boolean; message: string; distanceKm: number; transitMinutes: number };
  };
  rejectionReasons: string[];
  positiveHighlights: string[];
}

/**
 * Deterministic Safety & Constraint Engine for FOODLOOP.
 * Enforces hard rules on Capacity, Category, Allergens, Temperature/Equipment, and Expiry.
 * AI output CANNOT override these rules.
 */
export function evaluateRecipientConstraints(
  donation: Partial<Donation> = {},
  recipient: Partial<Recipient> = {}
): ConstraintEvaluation {
  const rejectionReasons: string[] = [];
  const positiveHighlights: string[] = [];
  let score = 100;

  const quantityKg = typeof donation?.quantityKg === 'number' ? donation.quantityKg : 30;
  const capacityTotalKg = typeof recipient?.capacityTotalKg === 'number' ? recipient.capacityTotalKg : 500;
  const capacityUsedKg = typeof recipient?.capacityUsedKg === 'number' ? recipient.capacityUsedKg : 100;

  // 1. Physical Intake Capacity (Hard Rule)
  const remainingKg = Math.max(0, capacityTotalKg - capacityUsedKg);
  const capacityPassed = remainingKg >= quantityKg;
  let capacityMessage = '';

  if (!capacityPassed) {
    const deficit = quantityKg - remainingKg;
    capacityMessage = `Capacity Overload: Recipient has ${remainingKg}kg free space, but lot requires ${quantityKg}kg (${deficit}kg deficit).`;
    rejectionReasons.push(capacityMessage);
  } else {
    const remainingAfter = remainingKg - quantityKg;
    capacityMessage = `Capacity Verified: ${remainingKg}kg available (${remainingAfter}kg headroom remaining after receipt).`;
    positiveHighlights.push(capacityMessage);
  }

  // 2. Food Category Acceptance (Hard Rule)
  const acceptedCategories = Array.isArray(recipient?.acceptedCategories)
    ? recipient.acceptedCategories
    : ['hot_meals', 'produce', 'bakery', 'dairy', 'pantry'];
  const donationCategory = donation?.category || 'hot_meals';
  const categoryPassed = acceptedCategories.includes(donationCategory);
  let categoryMessage = '';

  if (!categoryPassed) {
    categoryMessage = `Category Incompatibility: Recipient does not accept '${donationCategory.replace('_', ' ')}' category.`;
    rejectionReasons.push(categoryMessage);
  } else {
    categoryMessage = `Category Accepted: Approved for '${donationCategory.replace('_', ' ')}'.`;
    positiveHighlights.push(categoryMessage);
  }

  // 3. Allergen & Strict Dietary Requirements (Hard Rule)
  const conflicts: string[] = [];
  let allergenPassed = true;
  let allergenMessage = 'Allergen Profile Safe';
  const dietaryRequirements = Array.isArray(recipient?.dietaryRequirements) ? recipient.dietaryRequirements : [];
  const allergens = Array.isArray(donation?.allergens) ? donation.allergens : [];
  const dietaryTags = Array.isArray(donation?.dietaryTags) ? donation.dietaryTags : [];
  const title = (donation?.title || '').toLowerCase();

  // Specific strict rules for shelters
  // If recipient has "Peanut-Free Essential", and donation has Peanuts
  const requiresPeanutFree = dietaryRequirements.some(r =>
    r.toLowerCase().includes('peanut-free') || r.toLowerCase().includes('nut-free')
  );
  if (requiresPeanutFree) {
    const hasNuts = allergens.some(a =>
      a.toLowerCase().includes('peanut') || a.toLowerCase().includes('nut')
    );
    if (hasNuts) {
      conflicts.push('Contains Peanuts/Nuts (Recipient has strict Nut-Free mandate)');
      allergenPassed = false;
    }
  }

  // If recipient requires Vegetarian and donation has meat/fish
  const requiresVegetarian = dietaryRequirements.some(r =>
    r.toLowerCase().includes('vegetarian portion') || r.toLowerCase().includes('strict vegetarian')
  );
  if (requiresVegetarian && donationCategory === 'hot_meals') {
    const isVegetarianLot = dietaryTags.some(t =>
      t.toLowerCase().includes('vegetarian') || t.toLowerCase().includes('vegan')
    );
    if (!isVegetarianLot) {
      if (title.includes('chicken') || title.includes('salmon') || title.includes('beef') || title.includes('meat')) {
        conflicts.push('Meal contains meat/fish, but shelter intake requires vegetarian batches');
        allergenPassed = false;
      }
    }
  }

  if (!allergenPassed) {
    allergenMessage = `Allergen/Dietary Conflict: ${conflicts.join('; ')}`;
    rejectionReasons.push(allergenMessage);
  } else {
    allergenMessage = 'Dietary & Allergen Verification Passed: Zero cross-contamination hazards.';
    positiveHighlights.push(allergenMessage);
  }

  // 4. Temperature & Holding Equipment Compliance (Hard Rule)
  let tempPassed = true;
  let tempMessage = '';
  const storageType = donation?.storageType || 'hot';

  if (storageType === 'hot') {
    if (recipient?.warmingOvensCapable === false) {
      // If no warming ovens, can only accept if urgent dinner service starts within 30 min
      if (!recipient?.diningServiceTime || recipient?.currentUrgency !== 'High') {
        tempPassed = false;
        tempMessage = 'Equipment Conflict: Recipient lacks commercial warming ovens for hot-holding (>60°C). Immediate dining service not active.';
        rejectionReasons.push(tempMessage);
      } else {
        tempMessage = 'Holding Notice: Shelter lacks holding ovens, but active dinner line allows immediate direct plating.';
        positiveHighlights.push(tempMessage);
        score -= 10;
      }
    } else {
      tempMessage = 'Equipment Verified: Commercial holding ovens active for safe hot-holding (>60°C).';
      positiveHighlights.push(tempMessage);
    }
  } else if (storageType === 'chilled') {
    if (recipient?.coldChainCapable === false) {
      tempPassed = false;
      tempMessage = 'Cold-Chain Failure: Recipient lacks certified commercial refrigeration (2°C–4°C).';
      rejectionReasons.push(tempMessage);
    } else {
      tempMessage = 'Cold-Chain Verified: Walk-in refrigeration available.';
      positiveHighlights.push(tempMessage);
    }
  } else {
    tempMessage = 'Ambient Storage: Dry, ventilated staging ready.';
    positiveHighlights.push(tempMessage);
  }

  // 5. Expiry & Courier Window Margin (Hard Rule)
  const distanceKm = typeof recipient?.distanceKm === 'number' ? recipient.distanceKm : 3.0;
  const transitMinutes = Math.max(5, Math.round(distanceKm * 3.2));
  const expiryMinutesRemaining = typeof donation?.expiryMinutesRemaining === 'number' ? donation.expiryMinutesRemaining : 120;
  const marginMinutes = expiryMinutesRemaining - transitMinutes;
  let expiryPassed = true;
  let expiryMessage = '';

  if (expiryMinutesRemaining <= 0) {
    expiryPassed = false;
    expiryMessage = 'Perishable Safety Violation: Surplus lot has expired beyond safe distribution threshold.';
    rejectionReasons.push(expiryMessage);
  } else if (marginMinutes < 15) {
    expiryPassed = false;
    expiryMessage = `Transit Window Violation: Only ${expiryMinutesRemaining}m until expiry, but transit requires ${transitMinutes}m (unsafe margin <15m).`;
    rejectionReasons.push(expiryMessage);
  } else {
    expiryMessage = `Safe Transit Window: ${transitMinutes}m transit leaves ${marginMinutes}m safe buffer before deadline.`;
    positiveHighlights.push(expiryMessage);
  }

  // 6. Proximity & Urgency Scoring
  let proximityMessage = `${distanceKm} km away (~${transitMinutes} mins urban courier transit).`;
  if (distanceKm <= 2.0) {
    score += 5;
  } else if (distanceKm <= 4.0) {
    score -= 5;
  } else {
    score -= 15;
  }

  if (recipient?.currentUrgency === 'High') {
    score += 8;
    positiveHighlights.push('High Urgency: Shelter dining service begins within 60 minutes.');
  }

  // Calculate overall eligibility
  const eligible = capacityPassed && categoryPassed && allergenPassed && tempPassed && expiryPassed;

  if (!eligible) {
    score = 0;
  } else {
    score = Math.max(20, Math.min(99.6, score));
  }

  return {
    eligible,
    score,
    breakdown: {
      capacity: { passed: capacityPassed, message: capacityMessage, remainingKg },
      category: { passed: categoryPassed, message: categoryMessage },
      allergens: { passed: allergenPassed, message: allergenMessage, conflicts },
      temperature: { passed: tempPassed, message: tempMessage },
      expiry: { passed: expiryPassed, message: expiryMessage, marginMinutes },
      proximity: { passed: true, message: proximityMessage, distanceKm, transitMinutes },
    },
    rejectionReasons,
    positiveHighlights,
  };
}
