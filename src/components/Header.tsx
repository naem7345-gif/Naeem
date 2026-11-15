import React, { useEffect, useRef, useState } from 'react';
import { Home, Search, X } from 'lucide-react';
import { ViewState } from '../types/spotify';
import { handleSpotlightMove } from '../utils/hoverSpotlight';
import { shouldTriggerSearchShortcut } from '../utils/searchShortcut';
import { getHomeButtonVisualState, getNextHomePulseKey } from '../utils/homeAnimation';

interface HeaderProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  viewState,
  setViewState,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [homePulseKey, setHomePulseKey] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        shouldTriggerSearchShortcut({
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          targetTagName: target?.tagName,
          isContentEditable: target?.isContentEditable,
        })
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleHomeClick = () => {
    setHomePulseKey((prev) => getNextHomePulseKey(prev));
    setViewState({ type: 'home', filterTab: 'all' });
  };

  const handleSearchFocus = () => {
    if (viewState.type !== 'search') {
      setViewState({ type: 'search', searchQuery: '' });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setViewState({
      type: 'search',
      searchQuery: e.target.value,
    });
  };

  const clearSearch = () => {
    setViewState({
      type: 'search',
      searchQuery: '',
    });
    inputRef.current?.focus();
  };

  const homeVisual = getHomeButtonVisualState(viewState.type, homePulseKey);

  return (
    <header className="h-[54px] sm:h-16 px-2.5 sm:px-4 flex items-center justify-center bg-transparent select-none relative z-20 shrink-0">
      {/* Center: Home Button + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 max-w-xl w-full justify-center min-w-0">
        {/* Round Home button with GPU-composited orbiting ring, hover halo & click ripple */}
        <div className="group relative shrink-0 rounded-full p-[1.5px] transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.08] active:scale-[0.92]">
          {/* Soft outer halo faded purely via opacity (zero box-shadow animation) */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,rgba(30,215,96,0.36)_0%,rgba(56,189,248,0.16)_45%,transparent_72%)] transition-opacity duration-300 ${
              homeVisual.isHomeActive
                ? 'opacity-70 group-hover:opacity-100'
                : 'opacity-0 group-hover:opacity-90'
            }`}
          />

          {/* Click expanding ripple ring */}
          {homeVisual.isPulseActive && (
            <span
              key={`home-ripple-${homePulseKey}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border border-[#1ed760]/75 animate-home-ripple"
            />
          )}

          {/* Orbiting conic rim inside clipped shell */}
          <div className="relative rounded-full p-[1.5px] overflow-hidden">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute left-1/2 top-1/2 w-[96px] h-[96px] animate-home-orbit transition-opacity duration-300 ${
                homeVisual.isAmbientRingVisible
                  ? 'opacity-85 group-hover:opacity-100'
                  : 'opacity-25 group-hover:opacity-95'
              }`}
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(30,215,96,0.85) 60deg, rgba(56,189,248,0.55) 125deg, transparent 190deg, rgba(255,255,255,0.35) 260deg, transparent 360deg)',
              }}
            />

            <button
              onClick={handleHomeClick}
              aria-label="Home"
              data-home-active={homeVisual.isHomeActive ? 'true' : 'false'}
              className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-[background-color,border-color,color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer backdrop-blur-lg border ${
                homeVisual.isHomeActive
                  ? 'bg-[#121923]/92 border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                  : 'bg-[#0d1219]/90 border-white/10 text-[#b3b3b3] group-hover:text-white group-hover:bg-[#131b26]/95'
              }`}
            >
              <span
                key={`home-icon-${homePulseKey}`}
                className={homeVisual.isPulseActive ? 'animate-home-pop inline-flex' : 'inline-flex'}
              >
                <Home
                  className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[1px] group-hover:scale-110 ${
                    homeVisual.isHomeActive
                      ? 'text-[#1ed760]'
                      : 'group-hover:text-[#1ed760]'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Search input container — Liquid Metal animated outline + GPU-composited desktop hover/focus */}
        <div
          className="group relative flex-1 max-w-lg min-w-0 rounded-full md:transition-transform md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)] md:hover:scale-[1.015] md:focus-within:scale-[1.024]"
        >
          {/* Outer metallic chrome-emerald halo faded purely via opacity */}
          <div
            aria-hidden="true"
            className="hidden md:block pointer-events-none absolute -inset-1.5 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(226,232,240,0.2)_0%,rgba(30,215,96,0.2)_42%,transparent_75%)] opacity-25 group-hover:opacity-80 group-focus-within:opacity-100 transition-opacity duration-300"
          />

          {/* Liquid Metal 2px Outline Frame */}
          <div className="relative rounded-full p-[2px] overflow-hidden bg-[#1e293b]/70">
            {/* Primary molten chrome & gunmetal stream (CW) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 w-[540px] h-[540px] animate-search-liquid-primary opacity-80 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(51,65,85,0.35) 0deg, rgba(203,213,225,0.85) 28deg, rgba(255,255,255,1) 46deg, rgba(148,163,184,0.4) 72deg, rgba(30,41,59,0.25) 110deg, rgba(30,215,96,0.7) 148deg, rgba(248,250,252,0.96) 176deg, rgba(100,116,139,0.35) 215deg, rgba(125,211,252,0.6) 256deg, rgba(255,255,255,0.98) 288deg, rgba(71,85,105,0.3) 325deg, rgba(51,65,85,0.35) 360deg)',
              }}
            />

            {/* Secondary counter-flowing mercury specular highlights (CCW) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 w-[540px] h-[540px] animate-search-liquid-secondary mix-blend-screen opacity-65 group-hover:opacity-95 group-focus-within:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'conic-gradient(from 90deg, transparent 0deg, rgba(255,255,255,0.95) 16deg, rgba(186,230,253,0.55) 36deg, transparent 78deg, transparent 175deg, rgba(241,245,249,0.9) 196deg, rgba(30,215,96,0.55) 222deg, transparent 268deg, transparent 360deg)',
              }}
            />

            <div
              onMouseMove={(e) => {
                if (window.innerWidth >= 768) {
                  handleSpotlightMove(e);
                }
              }}
              className="desktop-search-spotlight relative flex items-center bg-[#0d1219]/95 md:bg-[#0d1219]/94 md:group-hover:bg-[#101720]/94 md:group-focus-within:bg-[#111924]/96 backdrop-blur-lg border border-white/10 rounded-full px-3.5 py-2 sm:py-2.5 transition-colors duration-250 text-[#b3b3b3] focus-within:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] overflow-hidden"
            >
              {/* Desktop-only Subtle Glass Sheen Sweep */}
              <div
                aria-hidden="true"
                className="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent animate-search-sheen"
              />

              <Search className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 mr-2.5 sm:mr-3 shrink-0 text-[#b3b3b3] md:transition-[transform,color] md:duration-250 md:ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:text-white md:group-hover:scale-110 md:group-focus-within:text-[#1ed760] md:group-focus-within:scale-110 md:group-focus-within:-rotate-6" />

              <input
                ref={inputRef}
                type="text"
                placeholder="What do you want to play?"
                value={viewState.type === 'search' ? viewState.searchQuery || '' : ''}
                onFocus={handleSearchFocus}
                onChange={handleSearchChange}
                className="relative z-10 bg-transparent border-none outline-none w-full min-w-0 text-sm text-white placeholder-[#8e8e8e] font-medium"
              />

              {viewState.type === 'search' && viewState.searchQuery ? (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="relative z-10 p-1 hover:text-white text-[#b3b3b3] cursor-pointer shrink-0 transition-transform hover:scale-110 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd
                  aria-hidden="true"
                  className="hidden md:inline-flex items-center justify-center relative z-10 ml-2 px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/12 text-[11px] font-semibold text-white/55 group-hover:text-white/80 group-hover:border-white/25 group-focus-within:opacity-0 group-focus-within:scale-90 transition-[opacity,transform,color,border-color] duration-200 shrink-0"
                >
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
