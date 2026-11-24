import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Bot, Users, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import { CityLocation, searchCities, POPULAR_INDIAN_CITIES } from '../../services/api/geocoding.ts';
import { FreshnessBadge } from './FreshnessBadge.tsx';
import { DataFreshness } from '../../types/air-quality.ts';
import { HouseholdProfile } from '../../types/profile.ts';

interface HeaderProps {
  currentCity: string;
  onSelectCity: (city: CityLocation) => void;
  freshness: DataFreshness;
  lastUpdated?: string;
  profile: HouseholdProfile;
  onOpenProfile: () => void;
  onOpenAI: () => void;
  onOpenScenarioModal: () => void;
  activeScenarioName?: string;
  isLoadingData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onSelectCity,
  freshness,
  lastUpdated,
  profile,
  onOpenProfile,
  onOpenAI,
  onOpenScenarioModal,
  activeScenarioName,
  isLoadingData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>(POPULAR_INDIAN_CITIES);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const results = await searchCities(searchQuery);
      setSearchResults(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setIsDropdownOpen(false);
        onSelectCity({
          id: 99999,
          name: 'My Current Location',
          state: 'GPS Coordinates',
          country: 'India',
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4))
        });
      },
      (err) => {
        setIsLocating(false);
        alert(`Location permission denied or unavailable: ${err.message}. Please select a city manually.`);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 py-2 sm:h-16 sm:flex-nowrap sm:gap-x-3 sm:py-0">
          
          {/* Logo & Brand */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-forest-900 flex items-center justify-center text-emerald-400 shadow-md">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 11a9 9 0 0 1 9-9z"/>
                <path d="M7 13c1.5-2 4-2 5.5 0"/>
                <path d="M9 16c1-1.5 2.5-1.5 3.5 0"/>
                <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-forest-950 tracking-tight font-sans whitespace-nowrap">AirAware <span className="text-emerald-600">AI</span></span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-forest-100 text-forest-800 rounded">India-First</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Breathe smarter. Live healthier.</p>
            </div>
          </div>

          {/* Location Selector */}
          <div className="relative order-3 w-full sm:order-2 sm:w-auto sm:flex-1 sm:max-w-xs md:max-w-sm" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-sm text-slate-800 border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">{currentCity}</span>
                {isLoadingData && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Search */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Indian city, district..."
                    className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="p-1 border-b border-slate-100">
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-left"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Detecting GPS location...' : 'Use exact device location'}</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {searchQuery ? 'Search Results' : 'Popular Indian Cities'}
                  </div>
                  {searchResults.map((city) => (
                    <button
                      key={`${city.id}-${city.name}`}
                      onClick={() => {
                        onSelectCity(city);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:bg-forest-50 hover:text-forest-900 rounded-lg transition-colors text-left"
                    >
                      <span className="font-medium">{city.name}</span>
                      <span className="text-[11px] text-slate-400">{city.state || city.country}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-3 sm:gap-2">
            
            {/* Telemetry Freshness */}
            <div className="hidden lg:block">
              <FreshnessBadge freshness={freshness} lastUpdated={lastUpdated} />
            </div>

            {/* Demo Scenarios Trigger */}
            <button
              onClick={onOpenScenarioModal}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeScenarioName 
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Test with 6 preset evaluation scenarios"
              aria-label="Open demo scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">{activeScenarioName ? activeScenarioName.slice(0, 16) + '...' : 'Demo Scenarios'}</span>
              <span className="hidden sm:inline md:hidden">Demo</span>
            </button>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-forest-50 text-forest-800 border border-forest-200 hover:bg-forest-100 transition-colors"
              title="Configure household characteristics"
            >
              <Users className="w-3.5 h-3.5 text-forest-600" />
              <span className="hidden md:inline">My Family</span>
              {profile.hasChildren && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>

            {/* AI Assistant Drawer Trigger */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-forest-900 text-white hover:bg-forest-800 shadow-sm transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
