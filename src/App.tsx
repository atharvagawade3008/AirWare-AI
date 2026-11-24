import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Navigation, ActiveTab } from './components/layout/Navigation.tsx';
import { AQIGauge } from './components/dashboard/AQIGauge.tsx';
import { WeatherCard } from './components/dashboard/WeatherCard.tsx';
import { GuidanceBanner } from './components/dashboard/GuidanceBanner.tsx';
import { QuickActions } from './components/dashboard/QuickActions.tsx';
import { PollutantCard } from './components/dashboard/PollutantCard.tsx';
import { PollutantGrid } from './components/air-quality/PollutantGrid.tsx';
import { ExposurePlanner } from './components/planner/ExposurePlanner.tsx';
import { IndoorAirDoctor } from './components/indoor/IndoorAirDoctor.tsx';
import { CleanerChoices } from './components/choices/CleanerChoices.tsx';
import { WhatIfCalculator } from './components/impact/WhatIfCalculator.tsx';
import { CommunityImpact } from './components/community/CommunityImpact.tsx';
import { AIChatDrawer } from './components/assistant/AIChatDrawer.tsx';
import { FamilyProfileModal } from './components/profile/FamilyProfileModal.tsx';
import { ScenarioSwitcher } from './components/demo/ScenarioSwitcher.tsx';

import { AirQualityContext, HourlyForecastPoint } from './types/air-quality.ts';
import { WeatherContext } from './types/weather.ts';
import { HouseholdProfile } from './types/profile.ts';
import { DemoScenario } from './types/demo.ts';
import { CityLocation } from './services/api/geocoding.ts';
import { fetchLiveEnvironmentalData } from './services/api/open-meteo.ts';
import { getStoredProfile, saveStoredProfile, getStoredCity, saveStoredCity } from './services/storage/profile-store.ts';
import { generatePersonalizedRecommendations } from './intelligence/recommendations/recommendation-engine.ts';
import { AlertTriangle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  // Household Profile State
  const [profile, setProfile] = useState<HouseholdProfile>(getStoredProfile);

  // Current City Location
  const [selectedCity, setSelectedCity] = useState(getStoredCity);

  // Environmental Telemetry State
  const [airQuality, setAirQuality] = useState<AirQualityContext | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [hourlyTrends, setHourlyTrends] = useState<HourlyForecastPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Demo Scenario Override State
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);

  // Fetch Live Data
  const loadLiveData = useCallback(async (lat: number, lon: number, name: string, state?: string) => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const res = await fetchLiveEnvironmentalData(lat, lon, name, state);
      setAirQuality(res.airQuality);
      setWeather(res.weather);
      setHourlyTrends(res.hourlyTrends);
    } catch (err: any) {
      console.error('Failed to load environmental data:', err);
      setDataError(err.message || 'Unable to contact live telemetry service.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!activeScenario) {
      loadLiveData(selectedCity.lat, selectedCity.lon, selectedCity.name, selectedCity.state);
    }
  }, [selectedCity, activeScenario, loadLiveData]);

  // Handle City Change
  const handleSelectCity = (city: CityLocation) => {
    setActiveScenario(null); // Clear scenario override when user picks a live city
    const updated = { name: city.name, state: city.state, lat: city.latitude, lon: city.longitude };
    setSelectedCity(updated);
    saveStoredCity(updated);
    loadLiveData(city.latitude, city.longitude, city.name, city.state);
  };

  // Handle Profile Update
  const handleSaveProfile = (updated: HouseholdProfile) => {
    setProfile(updated);
    saveStoredProfile(updated);
  };

  // Handle Scenario Selection
  const handleSelectScenario = (sc: DemoScenario) => {
    setActiveScenario(sc);
    setProfile(sc.profile);
    setAirQuality(sc.airQuality);
    setWeather(sc.weather);
    setIsLoadingData(false);
    setDataError(sc.forceApiError ? 'Simulated API Gateway 503 Outage: Demonstrating graceful fallback and data freshness preservation.' : null);
  };

  // Reset to Live Telemetry
  const handleResetToLive = () => {
    setActiveScenario(null);
    const stored = getStoredCity();
    setSelectedCity(stored);
    loadLiveData(stored.lat, stored.lon, stored.name, stored.state);
  };

  // Generate Personalized Recommendations via deterministic engine
  const effectiveAQI: AirQualityContext = airQuality || {
    location: selectedCity.name,
    state: selectedCity.state,
    country: 'India',
    latitude: selectedCity.lat,
    longitude: selectedCity.lon,
    provider: 'CAMS Atmospheric Model (Open-Meteo)',
    dataType: 'modelled_estimate',
    indexClassification: 'insufficient_data',
    freshness: 'delayed',
    pollutants: [],
    scientificDisclaimer: 'Initial environmental telemetry loading...'
  };

  const { guidanceSummary, exposurePlanner } = generatePersonalizedRecommendations(
    effectiveAQI,
    profile,
    weather || undefined
  );

  const airAwareContext = {
    airQuality: effectiveAQI,
    weather: weather || undefined,
    profile,
    activeScreen: activeTab
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-forest-500 selection:text-white">
      
      {/* Global Header */}
      <Header
        currentCity={activeScenario ? activeScenario.airQuality.location : selectedCity.name}
        onSelectCity={handleSelectCity}
        freshness={effectiveAQI.freshness}
        lastUpdated={effectiveAQI.lastUpdated}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAI={() => setIsAIChatOpen(true)}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        activeScenarioName={activeScenario ? activeScenario.name : undefined}
        isLoadingData={isLoadingData}
      />

      {/* Demo Scenario Notification Banner */}
      {activeScenario && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 border-b border-amber-600/20 text-xs font-semibold flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-950 shrink-0" />
              <span><strong>Evaluator Test Mode Active:</strong> {activeScenario.name} ({activeScenario.expectedOutcome})</span>
            </div>
            <button
              onClick={handleResetToLive}
              className="px-2.5 py-1 bg-amber-950 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-colors"
            >
              Back to Live Data
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Error Notification Banner if API failed */}
        {dataError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Telemetry Alert:</strong> {dataError}
                <div className="mt-1 text-slate-600">
                  AirAware AI does not invent fake replacement numbers. The application remains fully functional using last known verified readings and general evidence-conscious guidelines.
                </div>
              </div>
            </div>
            {!activeScenario && (
              <button
                onClick={() => loadLiveData(selectedCity.lat, selectedCity.lon, selectedCity.name, selectedCity.state)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl font-bold shrink-0 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: OVERVIEW (Main Dashboard) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Guidance Banner */}
            <GuidanceBanner
              guidance={guidanceSummary}
              profile={profile}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onNavigateToPlanner={() => setActiveTab('planner')}
            />

            {/* AQI Gauge + Weather Atmospheric Dispersion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <AQIGauge airQuality={effectiveAQI} />
              </div>
              <div className="lg:col-span-5">
                <WeatherCard weather={weather || undefined} />
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Decision Support Tools</h3>
              </div>
              <QuickActions onNavigate={setActiveTab} onOpenAI={() => setIsAIChatOpen(true)} />
            </div>

            {/* Key Pollutant Snapshots */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Pollutant Highlights</h3>
                <button
                  onClick={() => setActiveTab('air-quality')}
                  className="text-xs font-semibold text-forest-700 hover:text-forest-900 transition-colors"
                >
                  View full telemetry &amp; trends &rarr;
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {effectiveAQI.pollutants.map((p) => (
                  <PollutantCard key={p.code} pollutant={p} />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: AIR QUALITY (Detailed Telemetry & Hourly Trends) */}
        {activeTab === 'air-quality' && (
          <PollutantGrid airQuality={effectiveAQI} hourlyTrends={hourlyTrends} />
        )}

        {/* Tab 3: EXPOSURE PLANNER (Morning, Afternoon, Evening, Night) */}
        {activeTab === 'planner' && (
          <ExposurePlanner slots={exposurePlanner} profile={profile} />
        )}

        {/* Tab 4: INDOOR AIR DOCTOR */}
        {activeTab === 'indoor' && (
          <IndoorAirDoctor />
        )}

        {/* Tab 5: CLEANER CHOICES (Commute & Lifestyle) */}
        {activeTab === 'choices' && (
          <CleanerChoices airQuality={effectiveAQI} onSelectAction={() => setActiveTab('impact')} />
        )}

        {/* Tab 6: WHAT-IF IMPACT CALCULATOR */}
        {activeTab === 'impact' && (
          <WhatIfCalculator />
        )}

        {/* Tab 7: COMMUNITY IMPACT */}
        {activeTab === 'community' && (
          <CommunityImpact />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">AirAware AI</span>
            <span>• Breathe Smarter. Live Healthier.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Data: CPCB NAQI Standard &amp; Open-Meteo</span>
            <span>Zero Recurring Cost Architecture</span>
            <span className="font-mono text-forest-800">India-First Engine</span>
          </div>
        </div>
      </footer>

      {/* Household Profile Modal */}
      <FamilyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Scenario Switcher Modal (Evaluation Scenarios) */}
      <ScenarioSwitcher
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenario ? activeScenario.id : undefined}
        onResetToLive={handleResetToLive}
      />

      {/* AI Assistant Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        context={airAwareContext}
      />

    </div>
  );
}
