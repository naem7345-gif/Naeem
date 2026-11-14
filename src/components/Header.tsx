import React from 'react';
import { Home, Search, X } from 'lucide-react';
import { ViewState } from '../types/spotify';

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
  const handleHomeClick = () => {
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
  };

  return (
    <header className="h-16 px-4 flex items-center justify-center bg-transparent select-none z-30 shrink-0">

      {/* Center: Home Button + Search Bar */}
      <div className="flex items-center gap-2.5 max-w-xl w-full justify-center">
        {/* Round Home button */}
        <button
          onClick={handleHomeClick}
          aria-label="Home"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl border ${
            viewState.type === 'home'
              ? 'bg-white/[0.14] border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
              : 'bg-white/[0.07] border-white/10 text-[#b3b3b3] hover:text-white hover:bg-white/[0.12] hover:scale-105'
          }`}
        >
          <Home className="w-6 h-6" />
        </button>

        {/* Search input container */}
        <div className="relative flex-1 max-w-lg">
          <div className="flex items-center bg-white/[0.07] hover:bg-white/[0.11] focus-within:bg-white/[0.12] backdrop-blur-xl border border-white/10 focus-within:border-white/30 rounded-full px-3.5 py-2.5 transition-all text-[#b3b3b3] focus-within:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Search className="w-5 h-5 ml-1 mr-3 shrink-0 text-[#b3b3b3]" />
            <input
              type="text"
              placeholder="What do you want to play?"
              value={viewState.type === 'search' ? viewState.searchQuery || '' : ''}
              onFocus={handleSearchFocus}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-[#8e8e8e] font-medium"
            />
            {viewState.type === 'search' && viewState.searchQuery && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                className="p-1 hover:text-white text-[#b3b3b3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
