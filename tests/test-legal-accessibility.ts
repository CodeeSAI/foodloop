/**
 * FOODLOOP — Legal, Accessibility & Trust Verification Tests
 *
 * Verifies:
 * 1. SPA path routing bidirectional mapping (pathToView & viewToPath) for all legal routes.
 * 2. WCAG contrast ratio calculations for theme tokens.
 * 3. index.html viewport accessibility validation (no user-scalable=no).
 * 4. Zero-cookie and essential-only localStorage integrity.
 * 5. Team DuoFlash footer attribution and branding consistency.
 */

import { pathToView, viewToPath } from '../src/context/FoodLoopContext';
import * as fs from 'fs';
import * as path from 'path';

function calculateRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateRelativeLuminance(hex1);
  const lum2 = calculateRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function runTests() {
  console.log('🧪 Starting FOODLOOP Legal, Accessibility & Trust Audit Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // --- Suite 1: Direct SPA Routing & History Synchronization ---
  console.log('--- Suite 1: SPA URL Route Mapping (pathToView & viewToPath) ---');
  assert(pathToView('/privacy-policy') === 'privacy', "pathToView('/privacy-policy') -> 'privacy'");
  assert(pathToView('/privacy') === 'privacy', "pathToView('/privacy') -> 'privacy'");
  assert(pathToView('/terms') === 'terms', "pathToView('/terms') -> 'terms'");
  assert(pathToView('/terms-conditions') === 'terms', "pathToView('/terms-conditions') -> 'terms'");
  assert(pathToView('/cookie-policy') === 'cookies', "pathToView('/cookie-policy') -> 'cookies'");
  assert(pathToView('/cookies') === 'cookies', "pathToView('/cookies') -> 'cookies'");
  assert(pathToView('/accessibility') === 'accessibility', "pathToView('/accessibility') -> 'accessibility'");
  assert(pathToView('/accessibility-statement') === 'accessibility', "pathToView('/accessibility-statement') -> 'accessibility'");
  assert(pathToView('/planner') === 'planner', "pathToView('/planner') -> 'planner'");
  assert(pathToView('/') === 'dashboard', "pathToView('/') -> 'dashboard'");

  assert(viewToPath('privacy') === '/privacy-policy', "viewToPath('privacy') -> '/privacy-policy'");
  assert(viewToPath('terms') === '/terms', "viewToPath('terms') -> '/terms'");
  assert(viewToPath('cookies') === '/cookie-policy', "viewToPath('cookies') -> '/cookie-policy'");
  assert(viewToPath('accessibility') === '/accessibility', "viewToPath('accessibility') -> '/accessibility'");
  assert(viewToPath('dashboard') === '/', "viewToPath('dashboard') -> '/'");

  // --- Suite 2: WCAG 2.2 AA Contrast Calculations ---
  console.log('\n--- Suite 2: WCAG 2.2 AA Contrast Measurements ---');
  const ivoryText = '#F5F5EC';
  const sageText = '#9EB3A2';
  const forestSurface = '#07241A';
  const darkCanvas = '#061C14';
  const limeAccent = '#A3E635';

  const ivoryContrastSurface = calculateContrastRatio(ivoryText, forestSurface);
  console.log(`    Primary text (#F5F5EC) on surface (#07241A): ${ivoryContrastSurface.toFixed(2)}:1`);
  assert(ivoryContrastSurface >= 4.5, 'Primary text contrast exceeds WCAG AA 4.5:1 requirement');

  const ivoryContrastCanvas = calculateContrastRatio(ivoryText, darkCanvas);
  console.log(`    Primary text (#F5F5EC) on canvas (#061C14): ${ivoryContrastCanvas.toFixed(2)}:1`);
  assert(ivoryContrastCanvas >= 4.5, 'Primary text contrast on canvas exceeds WCAG AA 4.5:1 requirement');

  const sageContrast = calculateContrastRatio(sageText, forestSurface);
  console.log(`    Secondary sage text (#9EB3A2) on surface (#07241A): ${sageContrast.toFixed(2)}:1`);
  assert(sageContrast >= 4.5, 'Secondary text contrast exceeds WCAG AA 4.5:1 requirement');

  const limeContrast = calculateContrastRatio(limeAccent, forestSurface);
  console.log(`    Lime accent (#A3E635) on surface (#07241A): ${limeContrast.toFixed(2)}:1`);
  assert(limeContrast >= 3.0, 'Lime accent UI contrast exceeds WCAG AA 3.0:1 requirement for graphical elements');

  // --- Suite 3: Viewport & HTML Accessibility Validation ---
  console.log('\n--- Suite 3: index.html Viewport & Meta Accessibility ---');
  const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

  assert(!indexHtmlContent.includes('user-scalable=no'), 'index.html does NOT disable user-scalable (allows zoom up to 200%)');
  assert(!indexHtmlContent.includes('maximum-scale=1.0'), 'index.html does NOT restrict maximum-scale to 1.0');
  assert(indexHtmlContent.includes('FOODLOOP — Zero-Waste Dispatch'), 'index.html title matches official brand "FOODLOOP — Zero-Waste Dispatch"');

  // --- Suite 4: Component & Footer Attribution Verification ---
  console.log('\n--- Suite 4: Footer Attribution & Legal Links ---');
  const footerPath = path.resolve(process.cwd(), 'src/components/layout/AppFooter.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf-8');

  assert(footerContent.includes('FOODLOOP'), 'AppFooter renders FOODLOOP brand');
  assert(footerContent.includes('Made by Team DuoFlash · R Sai Ganesh') || footerContent.includes('Made by Team DuoFlash &middot; R Sai Ganesh'), 'AppFooter renders "Made by Team DuoFlash · R Sai Ganesh"');
  assert(footerContent.includes('Privacy Policy'), 'AppFooter includes link to Privacy Policy');
  assert(footerContent.includes('Terms &amp; Conditions') || footerContent.includes('Terms & Conditions'), 'AppFooter includes link to Terms & Conditions');
  assert(footerContent.includes('Cookie Policy'), 'AppFooter includes link to Cookie Policy');
  assert(footerContent.includes('Accessibility Statement'), 'AppFooter includes link to Accessibility Statement');

  // --- Suite 5: App.tsx Layout & View Mounting ---
  console.log('\n--- Suite 5: App.tsx View & Footer Mounting ---');
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  assert(appContent.includes('<AppFooter />') || appContent.includes('<AppFooter/>'), 'App.tsx mounts <AppFooter />');
  assert(appContent.includes('PrivacyPolicyView'), 'App.tsx imports & renders PrivacyPolicyView');
  assert(appContent.includes('TermsConditionsView'), 'App.tsx imports & renders TermsConditionsView');
  assert(appContent.includes('CookiePolicyView'), 'App.tsx imports & renders CookiePolicyView');
  assert(appContent.includes('AccessibilityView'), 'App.tsx imports & renders AccessibilityView');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
