import React, { useState } from 'react';
import { FoodLoopProvider, useFoodLoop } from './context/FoodLoopContext';
import { AppHeader } from './components/layout/AppHeader';
import { Sidebar } from './components/layout/Sidebar';
import { DemoBanner } from './components/layout/DemoBanner';
import { AppFooter } from './components/layout/AppFooter';
import { ToastContainer } from './components/layout/ToastContainer';
import { ResetConfirmModal } from './components/layout/ResetConfirmModal';
import { OperationsDashboardView } from './components/views/OperationsDashboardView';
import { CreateDonationView } from './components/views/CreateDonationView';
import { RecipientMatchingView } from './components/views/RecipientMatchingView';
import { AiPlannerView } from './components/views/AiPlannerView';
import { TrackingHandoffView } from './components/views/TrackingHandoffView';
import { ImpactAnalyticsView } from './components/views/ImpactAnalyticsView';
import { PrivacyPolicyView } from './components/views/PrivacyPolicyView';
import { TermsConditionsView } from './components/views/TermsConditionsView';
import { CookiePolicyView } from './components/views/CookiePolicyView';
import { AccessibilityView } from './components/views/AccessibilityView';

const MainContent: React.FC = () => {
  const { activeView } = useFoodLoop();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#061C14] text-[#F5F5EC] relative">
      {/* Deep ambient radial lighting mesh */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-emerald-accent/[0.18] blur-[150px] z-0" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed bottom-[-15%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-lime-accent/[0.08] blur-[170px] z-0" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-forest-light/[0.15] blur-[180px] z-0" 
      />

      {/* Sidebar (Desktop + Mobile) */}
      <Sidebar
        isMobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Hackathon Demo Context Ribbon */}
        <DemoBanner />

        {/* Top App Header with Frosted Dark Glass */}
        <AppHeader onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} />

        {/* Content View Area with Smooth Transitions */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative" id="main-content">
          <div key={activeView} className="view-transition max-w-7xl mx-auto pb-12 flex flex-col min-h-full">
            <div className="flex-1">
              {activeView === 'dashboard' && <OperationsDashboardView />}
              {activeView === 'create' && <CreateDonationView />}
              {activeView === 'matching' && <RecipientMatchingView />}
              {activeView === 'planner' && <AiPlannerView />}
              {activeView === 'tracking' && <TrackingHandoffView />}
              {activeView === 'analytics' && <ImpactAnalyticsView />}
              {activeView === 'privacy' && <PrivacyPolicyView />}
              {activeView === 'terms' && <TermsConditionsView />}
              {activeView === 'cookies' && <CookiePolicyView />}
              {activeView === 'accessibility' && <AccessibilityView />}
            </div>

            {/* Persistent Global Footer across all views */}
            <AppFooter />
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Demo Reset Confirmation Modal */}
      <ResetConfirmModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FoodLoopProvider>
      <MainContent />
    </FoodLoopProvider>
  );
};

export default App;
