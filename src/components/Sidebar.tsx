import React, { useState, useRef, useEffect } from 'react';
import {
  Library,
  Plus,
  ArrowRight,
  ArrowLeft,
  Search,
  ListFilter,
  Pin,
  Heart,
  Globe,
  Podcast,
  X,
  ChevronUp,
} from 'lucide-react';
import { Artist, Playlist, ViewState } from '../types/spotify';
import { CoverArt } from './CoverArt';
import { handleSpotlightMove } from '../utils/hoverSpotlight';
import { getDesktopShutterLayout } from '../utils/shutterState';

interface SidebarProps {
  playlists: Playlist[];
  artists: Artist[];
  podcastPlaylists: Playlist[];
  podcastShows: Artist[];
  likedCount: number;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  onCreatePlaylist: () => void;
  isLoggedIn: boolean;
  isMobileOpen?: boolean;
  onOpenMobile?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  playlists,
  artists,
  podcastPlaylists,
  podcastShows,
  likedCount,
  viewState,
  setViewState,
  onCreatePlaylist,
  isMobileOpen = false,
  onOpenMobile,
  onCloseMobile,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'podcasts'>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const leaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 160);
  };

  const desktopLayout = getDesktopShutterLayout({
    isHovered,
    isPinnedOpen,
    isSearchOpen,
  });
  const isShutterOpen = isMobileOpen || desktopLayout.isExpanded;
  const searchLower = librarySearch.trim().toLowerCase();

  const navigateAndCloseMobile = (nextState: ViewState) => {
    setViewState(nextState);
    if (isMobileOpen) {
      onCloseMobile?.();
    }
  };

  const filteredPlaylists = playlists.filter((p) => {
    if (activeFilter === 'podcasts') {
      return Boolean(p.isPodcast);
    }
    if (activeFilter === 'artists') {
      return false;
    }
    if (searchLower) {
      return (
        p.title.toLowerCase().includes(searchLower) ||
        p.owner.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredPodcastPlaylists = podcastPlaylists.filter((p) =>
    searchLower
      ? p.title.toLowerCase().includes(searchLower) ||
        p.owner.toLowerCase().includes(searchLower)
      : true
  );

  const filteredPodcastShows = podcastShows.filter((s) =>
    searchLower ? s.name.toLowerCase().includes(searchLower) : true
  );

  const filteredArtists = artists.filter((a) =>
    searchLower ? a.name.toLowerCase().includes(searchLower) : true
  );

  const sidebarContent = (
    <>
      {/* Subtle Shutter Accent Edge */}
      <div
        className={`pointer-events-none absolute right-0 top-10 bottom-10 w-[2px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hidden md:block ${
          isShutterOpen
            ? 'opacity-0 scale-y-75'
            : 'opacity-55 scale-y-100 bg-gradient-to-b from-transparent via-[#1ed760]/70 to-transparent'
        }`}
      />

      {/* Sidebar Header — Fixed Left Axis so Icon Never Jumps */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between text-[#b3b3b3]">
        <button
          onClick={() => navigateAndCloseMobile({ type: 'home' })}
          title="Your Library"
          className="flex items-center gap-3 hover:text-white transition-colors group cursor-pointer min-w-0"
        >
          <span className="w-10 h-8 md:w-12 flex items-center justify-center shrink-0">
            <Library className="w-6 h-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:text-white" />
          </span>
          <span
            className={`font-bold text-base text-[#b3b3b3] group-hover:text-white whitespace-nowrap transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isShutterOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-3 pointer-events-none'
            }`}
          >
            Your Library
          </span>
        </button>

        <div
          className={`flex items-center gap-1 shrink-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isShutterOpen
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-2 pointer-events-none'
          }`}
        >
          <button
            onClick={() => {
              onCreatePlaylist();
              if (isMobileOpen) onCloseMobile?.();
            }}
            aria-label="Create playlist or folder"
            title="Create playlist"
            className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPinnedOpen((prev) => !prev)}
            aria-label={isPinnedOpen ? 'Collapse library shutter' : 'Keep library open'}
            title={isPinnedOpen ? 'Auto-fold on mouse leave' : 'Keep open'}
            className={`p-2 hover:bg-white/10 hover:text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hidden md:block ${
              isPinnedOpen ? 'text-[#1ed760]' : ''
            }`}
          >
            {isPinnedOpen ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              aria-label="Close library"
              className="md:hidden p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills & Library Search — Smooth CSS Grid-Row Shutter Reveal */}
      <div
        className={`grid shrink-0 transition-[grid-template-rows,opacity] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isShutterOpen
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter(activeFilter === 'playlists' ? 'all' : 'playlists')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap border ${
                activeFilter === 'playlists'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.14]'
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === 'artists' ? 'all' : 'artists')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap border ${
                activeFilter === 'artists'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.14]'
              }`}
            >
              Artists
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === 'podcasts' ? 'all' : 'podcasts')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap border ${
                activeFilter === 'podcasts'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.14]'
              }`}
            >
              Podcasts
            </button>
          </div>

          {/* Library Search & Sort Row */}
          <div className="px-4 py-1.5 flex items-center justify-between text-[#b3b3b3]">
            <div className="flex items-center flex-1 mr-2">
              {isSearchOpen ? (
                <div className="flex items-center bg-white/[0.08] border border-white/10 rounded-xl px-2.5 py-1.5 w-full text-xs backdrop-blur-lg">
                  <Search className="w-3.5 h-3.5 mr-2 shrink-0 text-[#b3b3b3]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search in Your Library"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    onBlur={() => !librarySearch && setIsSearchOpen(false)}
                    className="bg-transparent border-none outline-none w-full text-white placeholder-[#757575]"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search in Your Library"
                  className="p-1.5 hover:bg-white/10 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            <button className="flex items-center gap-1.5 text-xs font-medium hover:text-white hover:scale-105 transition-all cursor-pointer whitespace-nowrap">
              <span>Recents</span>
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Library List / Fixed Left-Axis Shutter Slats */}
      <div className="flex-1 overflow-y-auto px-2.5 space-y-1.5 no-scrollbar">
        {/* Liked Songs Special Item (shown in All & Playlists filters) */}
        {(activeFilter === 'all' || activeFilter === 'playlists') && (
          <div
            onClick={() => navigateAndCloseMobile({ type: 'playlist', id: 'playlist-liked' })}
            title="Liked Songs"
            className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 cursor-pointer group ${
              viewState.type === 'playlist' && viewState.id === 'playlist-liked'
                ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.1] hover:border-white/15'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] ring-1 ring-white/20 flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(69,10,245,0.35)] transition-transform duration-250 group-hover:scale-105">
              <Heart className="w-5 h-5 text-white fill-white transition-transform duration-250 group-hover:scale-110" />
            </div>
            <div
              className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isShutterOpen
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-2 pointer-events-none'
              }`}
            >
              <p className="text-white font-medium text-sm truncate group-hover:text-white">
                Liked Songs
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#a7a7a7]">
                <Pin className="w-3 h-3 text-[#1ed760] fill-[#1ed760] rotate-45 shrink-0" />
                <span className="truncate">Playlist • {likedCount} tracks</span>
              </div>
            </div>
          </div>
        )}

        {/* Podcasts Filter List (Live fetched Podcast Shows & Series) */}
        {activeFilter === 'podcasts' && (
          <>
            <div
              onClick={() => navigateAndCloseMobile({ type: 'home', filterTab: 'podcasts' })}
              title="Open Podcasts Hub"
              className="flex items-center gap-3 p-1.5 rounded-2xl border bg-[#1ed760]/10 border-[#1ed760]/30 hover:bg-[#1ed760]/20 hover:translate-x-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1ed760]/20 ring-1 ring-[#1ed760]/40 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Podcast className="w-5 h-5 text-[#1ed760]" />
              </div>
              <div
                className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isShutterOpen
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 pointer-events-none'
                }`}
              >
                <p className="text-[#1ed760] font-bold text-sm truncate">
                  All Podcasts Hub
                </p>
                <p className="text-xs text-[#a7a7a7] truncate">
                  {podcastShows.length} shows • {podcastPlaylists.length} series
                </p>
              </div>
            </div>

            {filteredPodcastShows.map((show) => {
              const isSelected = viewState.type === 'artist' && viewState.id === show.id;
              return (
                <div
                  key={`sb-pod-show-${show.id}`}
                  onClick={() => navigateAndCloseMobile({ type: 'artist', id: show.id })}
                  title={show.name}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 cursor-pointer group ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.09] hover:border-white/15'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={show.avatarUrl}
                      fallbackSrc={show.fallbackAvatarUrl}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isShutterOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                  >
                    <p
                      className={`font-medium text-sm truncate ${
                        isSelected ? 'text-[#1ed760]' : 'text-white'
                      }`}
                    >
                      {show.name}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate">Podcast Show</p>
                  </div>
                </div>
              );
            })}

            {filteredPodcastPlaylists.map((playlist) => {
              const isSelected = viewState.type === 'playlist' && viewState.id === playlist.id;
              return (
                <div
                  key={`sb-pod-pl-${playlist.id}`}
                  onClick={() => navigateAndCloseMobile({ type: 'playlist', id: playlist.id })}
                  title={playlist.title}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 cursor-pointer group ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.09] hover:border-white/15'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={playlist.coverUrl}
                      fallbackSrc={playlist.fallbackCoverUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isShutterOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                  >
                    <p
                      className={`font-medium text-sm truncate ${
                        isSelected ? 'text-[#1ed760]' : 'text-white'
                      }`}
                    >
                      {playlist.title}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate">
                      Podcast Series • {playlist.owner}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Artists Filter List */}
        {activeFilter === 'artists' &&
          filteredArtists.map((artist) => {
            const isSelected = viewState.type === 'artist' && viewState.id === artist.id;
            return (
              <div
                key={`sb-art-${artist.id}`}
                onClick={() => navigateAndCloseMobile({ type: 'artist', id: artist.id })}
                title={artist.name}
                className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 cursor-pointer group ${
                  isSelected
                    ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'bg-white/[0.02] border-transparent hover:bg-white/[0.09] hover:border-white/15'
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                  <CoverArt
                    src={artist.avatarUrl}
                    fallbackSrc={artist.fallbackAvatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div
                  className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isShutterOpen
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-2 pointer-events-none'
                  }`}
                >
                  <p
                    className={`font-medium text-sm truncate ${
                      isSelected ? 'text-[#1ed760]' : 'text-white'
                    }`}
                  >
                    {artist.name}
                  </p>
                  <p className="text-xs text-[#a7a7a7] truncate">Artist</p>
                </div>
              </div>
            );
          })}

        {/* Playlists list */}
        {(activeFilter === 'all' || activeFilter === 'playlists') &&
          filteredPlaylists
            .filter((p) => p.id !== 'playlist-liked')
            .map((playlist) => {
              const isSelected = viewState.type === 'playlist' && viewState.id === playlist.id;
              return (
                <div
                  key={playlist.id}
                  onClick={() => navigateAndCloseMobile({ type: 'playlist', id: playlist.id })}
                  title={playlist.title}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 cursor-pointer group ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.09] hover:border-white/15'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={playlist.coverUrl}
                      fallbackSrc={playlist.fallbackCoverUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isShutterOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                  >
                    <p
                      className={`font-medium text-sm truncate ${
                        isSelected ? 'text-[#1ed760]' : 'text-white group-hover:text-white'
                      }`}
                    >
                      {playlist.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#a7a7a7] truncate">
                      {playlist.isPinned && (
                        <Pin className="w-3 h-3 text-[#1ed760] fill-[#1ed760] rotate-45 shrink-0 inline mr-1" />
                      )}
                      <span className="truncate">Playlist • {playlist.owner}</span>
                    </div>
                  </div>
                </div>
              );
            })}

        {/* Prompt Callout Cards — Smooth CSS Grid-Row Shutter Reveal */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isShutterOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-3 pb-2 space-y-3 px-0.5">
              <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <div>
                  <p className="text-white font-bold text-sm">Create your first playlist</p>
                  <p className="text-[#a7a7a7] text-xs mt-1">It's easy, we'll help you</p>
                </div>
                <button
                  onClick={() => {
                    onCreatePlaylist();
                    if (isMobileOpen) onCloseMobile?.();
                  }}
                  className="bg-white text-black font-bold text-xs py-2 px-4 rounded-full w-fit hover:scale-105 transition-transform cursor-pointer"
                >
                  Create playlist
                </button>
              </div>

              <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <div>
                  <p className="text-white font-bold text-sm">Let's find some podcasts to follow</p>
                  <p className="text-[#a7a7a7] text-xs mt-1">We'll keep you updated on new episodes</p>
                </div>
                <button
                  onClick={() => navigateAndCloseMobile({ type: 'home', filterTab: 'podcasts' })}
                  className="bg-white text-black font-bold text-xs py-2 px-4 rounded-full w-fit hover:scale-105 transition-transform cursor-pointer"
                >
                  Browse podcasts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Language Footer — Fixed Left Axis */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center">
        <button
          title="English"
          className={`flex items-center bg-white/[0.05] hover:bg-white/[0.12] border border-white/20 hover:border-white text-white h-8 rounded-full text-xs font-bold transition-[background-color,border-color,padding,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer overflow-hidden ${
            isShutterOpen ? 'px-3.5 gap-2 w-auto' : 'w-12 justify-center px-0 gap-0'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-[opacity,transform,max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isShutterOpen
                ? 'opacity-100 max-w-[90px] translate-x-0'
                : 'opacity-0 max-w-0 -translate-x-2'
            }`}
          >
            English
          </span>
        </button>
      </div>
    </>
  );

  const mobileQuickPlaylists = playlists.filter((p) => p.id !== 'playlist-liked').slice(0, 6);

  return (
    <>
      {/* Desktop Hover-Shutter Sidebar — Floats smoothly on hover without reflowing main feed */}
      <div
        style={{ width: desktopLayout.reserveWidth }}
        className="hidden md:block relative shrink-0 h-full transition-[width] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)] z-30"
      >
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleSpotlightMove}
          aria-expanded={isShutterOpen}
          style={{ width: desktopLayout.panelWidth }}
          className={`hover-spotlight shutter-panel absolute inset-y-0 left-0 flex flex-col rounded-3xl overflow-hidden select-none backdrop-blur-xl border ${
            desktopLayout.isFloatingOverlay
              ? 'bg-[#0c121b]/95 border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_56px_rgba(0,0,0,0.78)]'
              : 'bg-white/[0.05] border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_34px_rgba(0,0,0,0.42)]'
          }`}
        >
          {/* Fixed 316px inner shutter track prevents child text/row reflow during width glide */}
          <div className="flex flex-col flex-1 min-h-0 w-[316px]">
            {sidebarContent}
          </div>
        </aside>
      </div>

      {/* Mobile Separate Thumb-Zone Library Shutter Dock Box (always visible on phone above mini-player) */}
      <section
        aria-label="Mobile Your Library dock"
        className="md:hidden order-2 shrink-0 bg-white/[0.06] backdrop-blur-2xl border border-white/12 rounded-2xl px-2 py-1.5 flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_28px_rgba(0,0,0,0.45)]"
      >
        <button
          onClick={() => onOpenMobile?.()}
          aria-label="Open Your Library shutter"
          className="flex items-center gap-1.5 px-2.5 min-h-[42px] rounded-xl bg-white/[0.09] hover:bg-white/[0.15] active:scale-95 border border-white/12 text-white transition-all duration-200 cursor-pointer shrink-0"
        >
          <Library className="w-4 h-4 text-[#1ed760] shrink-0" />
          <span className="text-xs font-bold whitespace-nowrap">Library</span>
          <ChevronUp className="w-3.5 h-3.5 text-white/70 shrink-0" />
        </button>

        {/* Quick Horizontal Thumbnails inside Mobile Library Box */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0 py-0.5">
          <button
            onClick={() => setViewState({ type: 'playlist', id: 'playlist-liked' })}
            aria-label="Liked Songs"
            title="Liked Songs"
            className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ${
              viewState.type === 'playlist' && viewState.id === 'playlist-liked'
                ? 'ring-2 ring-[#1ed760]'
                : 'ring-1 ring-white/20'
            }`}
          >
            <Heart className="w-4 h-4 text-white fill-white" />
          </button>

          {mobileQuickPlaylists.map((pl) => {
            const isSelected = viewState.type === 'playlist' && viewState.id === pl.id;
            return (
              <button
                key={`mob-dock-pl-${pl.id}`}
                onClick={() => setViewState({ type: 'playlist', id: pl.id })}
                aria-label={pl.title}
                title={pl.title}
                className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 active:scale-95 transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#1ed760]' : 'ring-1 ring-white/15'
                }`}
              >
                <CoverArt
                  src={pl.coverUrl}
                  fallbackSrc={pl.fallbackCoverUrl}
                  alt={pl.title}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}

          {artists.slice(0, 4).map((art) => {
            const isSelected = viewState.type === 'artist' && viewState.id === art.id;
            return (
              <button
                key={`mob-dock-art-${art.id}`}
                onClick={() => setViewState({ type: 'artist', id: art.id })}
                aria-label={art.name}
                title={art.name}
                className={`w-10 h-10 rounded-full overflow-hidden shrink-0 active:scale-95 transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#1ed760]' : 'ring-1 ring-white/15'
                }`}
              >
                <CoverArt
                  src={art.avatarUrl}
                  fallbackSrc={art.fallbackAvatarUrl}
                  alt={art.name}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={onCreatePlaylist}
          aria-label="Create playlist"
          title="Create playlist"
          className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 border border-white/12 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </section>

      {/* Mobile Upward Shutter Sheet Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-end p-2"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="animate-drawer-up w-full h-[min(80dvh,620px)] flex flex-col bg-[#0e131b]/95 backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden select-none shadow-[0_-18px_60px_rgba(0,0,0,0.85)] relative"
          >
            <div className="pt-2.5 pb-0.5 flex justify-center shrink-0">
              <button
                onClick={onCloseMobile}
                aria-label="Collapse library shutter"
                className="w-10 h-1.5 rounded-full bg-white/25 hover:bg-white/40 transition-colors cursor-pointer"
              />
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
