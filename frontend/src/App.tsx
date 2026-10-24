import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClinicalSafeguardBanner } from './components/ClinicalSafeguardBanner';
import { AccessibleLanding } from './components/AccessibleLanding';
import { AssessmentBatteryRunner } from './components/AssessmentBatteryRunner';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { ResearchMLDashboard } from './components/ResearchMLDashboard';
import { InformedConsentModal } from './components/InformedConsentModal';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal';
import { api } from './services/api';
import { DatabaseStatus, Participant, Role, User } from './types';
import { ShieldCheck, Database, Brain, HeartHandshake } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Modals
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [dbDiagnosticsModalOpen, setDbDiagnosticsModalOpen] = useState(false);

  // Accessibility States
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<'standard' | 'large' | 'extra-large'>('standard');
  const [darkMode, setDarkMode] = useState(false);

  // Initialize Auth & Database Status on mount
  useEffect(() => {
    // 1. Initial demo auth as Clinician
    api.demoSwitch('clinician').then((auth) => {
      setCurrentUser({
        user_id: auth.user_id,
        email: auth.email,
        role: auth.role,
        full_name: auth.full_name,
        participant_id: auth.participant_id,
        is_active: true,
      });
    }).catch(console.error);

    // 2. Fetch default seeded participant
    api.getParticipant('p-1001-synth').then((p) => {
      setCurrentParticipant(p);
    }).catch(() => {});

    // 3. Fetch Exasol status
    refreshDbStatus();
  }, []);

  const refreshDbStatus = async () => {
    try {
      const status = await api.getDatabaseStatus();
      setDbStatus(status);
    } catch (err) {
      console.error('Failed to get database status:', err);
    }
  };

  // Accessibility classes application to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove('large-text', 'extra-large-text', 'high-contrast');

    if (textSize === 'large') body.classList.add('large-text');
    if (textSize === 'extra-large') body.classList.add('extra-large-text');
    if (highContrast) body.classList.add('high-contrast');

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [textSize, highContrast, darkMode]);

  const handleSwitchRole = async (newRole: Role) => {
    try {
      const auth = await api.demoSwitch(newRole);
      setCurrentUser({
        user_id: auth.user_id,
        email: auth.email,
        role: auth.role,
        full_name: auth.full_name,
        participant_id: auth.participant_id,
        is_active: true,
      });

      // Contextual tab switch
      if (newRole === 'participant') {
        setCurrentTab('dashboard');
      } else if (newRole === 'clinician') {
        setCurrentTab('clinician');
      } else if (newRole === 'researcher') {
        setCurrentTab('research');
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleCycleTextSize = () => {
    if (textSize === 'standard') setTextSize('large');
    else if (textSize === 'large') setTextSize('extra-large');
    else setTextSize('standard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-smooth">
      {/* Persistent Clinical Safeguards Regulatory Banner */}
      <ClinicalSafeguardBanner />

      {/* Main Accessible Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        dbStatus={dbStatus}
        onOpenDbDiagnostics={() => setDbDiagnosticsModalOpen(true)}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        textSize={textSize}
        onCycleTextSize={handleCycleTextSize}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {currentTab === 'landing' && (
          <AccessibleLanding
            onStartScreening={() => {
              if (!currentParticipant) {
                setConsentModalOpen(true);
              } else {
                setCurrentTab('battery');
              }
            }}
            onOpenClinician={() => {
              handleSwitchRole('clinician');
              setCurrentTab('clinician');
            }}
            onOpenResearch={() => {
              handleSwitchRole('researcher');
              setCurrentTab('research');
            }}
            onOpenDbDiagnostics={() => setDbDiagnosticsModalOpen(true)}
          />
        )}

        {currentTab === 'battery' && (
          <AssessmentBatteryRunner
            participant={currentParticipant}
            onRequestConsent={() => setConsentModalOpen(true)}
            onFinishBattery={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'dashboard' && (
          <ParticipantDashboard
            participant={currentParticipant}
            onStartNewSession={() => setCurrentTab('battery')}
          />
        )}

        {currentTab === 'clinician' && (
          <ClinicianDashboard />
        )}

        {currentTab === 'research' && (
          <ResearchMLDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 transition-smooth mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-sky-600" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              MindBridge AI Cognitive Screening & Research Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px]">
              <Database className="w-3.5 h-3.5 text-amber-500" />
              {dbStatus?.is_mock ? 'Explicit Mock Exasol' : 'Exasol Personal (8563)'}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-[11px]">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              IRB Protocol MB-2026
            </span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Investigational & screening instrument only &bull; Not a clinical diagnosis of Alzheimer's disease.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InformedConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onConsentComplete={(newParticipant) => {
          setCurrentParticipant(newParticipant);
          setCurrentTab('battery');
        }}
      />

      <SystemDiagnosticsModal
        isOpen={dbDiagnosticsModalOpen}
        onClose={() => setDbDiagnosticsModalOpen(false)}
        status={dbStatus}
        onRefreshStatus={refreshDbStatus}
      />
    </div>
  );
}

export default App;
