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
} from 'lucide-react';
import { Artist, Playlist, ViewState } from '../types/spotify';
import { CoverArt } from './CoverArt';

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
    }, 80);
  };

  const isShutterOpen = isHovered || isPinnedOpen || isSearchOpen;
  const searchLower = librarySearch.trim().toLowerCase();

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

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={isShutterOpen}
      style={{ width: isShutterOpen ? 312 : 82 }}
      className="h-full flex flex-col bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden select-none shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_40px_rgba(0,0,0,0.45)] relative will-change-[width] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      {/* Subtle Shutter Accent Edge */}
      <div
        className={`pointer-events-none absolute right-0 top-10 bottom-10 w-[2px] rounded-full transition-opacity duration-500 ${
          isShutterOpen
            ? 'opacity-0'
            : 'opacity-45 bg-gradient-to-b from-transparent via-[#1ed760]/60 to-transparent'
        }`}
      />

      {/* Sidebar Header — Fixed Left Axis so Icon Never Jumps */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between text-[#b3b3b3]">
        <button
          onClick={() => setViewState({ type: 'home' })}
          title="Your Library"
          className="flex items-center gap-3 hover:text-white transition-colors group cursor-pointer min-w-0"
        >
          <span className="w-12 h-8 flex items-center justify-center shrink-0">
            <Library className="w-6 h-6 group-hover:text-white" />
          </span>
          <span
            className={`font-bold text-base text-[#b3b3b3] group-hover:text-white whitespace-nowrap transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isShutterOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-3 pointer-events-none'
            }`}
          >
            Your Library
          </span>
        </button>

        <div
          className={`flex items-center gap-1 shrink-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isShutterOpen
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-2 pointer-events-none'
          }`}
        >
          <button
            onClick={onCreatePlaylist}
            aria-label="Create playlist or folder"
            title="Create playlist"
            className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPinnedOpen((prev) => !prev)}
            aria-label={isPinnedOpen ? 'Collapse library shutter' : 'Keep library open'}
            title={isPinnedOpen ? 'Auto-fold on mouse leave' : 'Keep open'}
            className={`p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors cursor-pointer hidden sm:block ${
              isPinnedOpen ? 'text-[#1ed760]' : ''
            }`}
          >
            {isPinnedOpen ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Pills & Library Search — Smooth CSS Grid-Row Shutter Reveal */}
      <div
        className={`grid shrink-0 transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
          onClick={() => setViewState({ type: 'playlist', id: 'playlist-liked' })}
          title="Liked Songs"
          className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-colors cursor-pointer group backdrop-blur-md ${
            viewState.type === 'playlist' && viewState.id === 'playlist-liked'
              ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.09] hover:border-white/15'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#450af5] to-[#8e8ee5] ring-1 ring-white/20 flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(69,10,245,0.35)]">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div
            className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
              onClick={() => setViewState({ type: 'home', filterTab: 'podcasts' })}
              title="Open Podcasts Hub"
              className="flex items-center gap-3 p-1.5 rounded-2xl border bg-[#1ed760]/10 border-[#1ed760]/30 hover:bg-[#1ed760]/20 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1ed760]/20 ring-1 ring-[#1ed760]/40 flex items-center justify-center shrink-0">
                <Podcast className="w-5 h-5 text-[#1ed760]" />
              </div>
              <div
                className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                  onClick={() => setViewState({ type: 'artist', id: show.id })}
                  title={show.name}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-colors cursor-pointer group backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={show.avatarUrl}
                      fallbackSrc={show.fallbackAvatarUrl}
                      alt={show.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                  onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                  title={playlist.title}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-colors cursor-pointer group backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={playlist.coverUrl}
                      fallbackSrc={playlist.fallbackCoverUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                onClick={() => setViewState({ type: 'artist', id: artist.id })}
                title={artist.name}
                className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-colors cursor-pointer group backdrop-blur-md ${
                  isSelected
                    ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'bg-white/[0.02] border-transparent hover:bg-white/[0.08] hover:border-white/10'
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                  <CoverArt
                    src={artist.avatarUrl}
                    fallbackSrc={artist.fallbackAvatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                  onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                  title={playlist.title}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-colors cursor-pointer group backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/[0.13] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                    <CoverArt
                      src={playlist.coverUrl}
                      fallbackSrc={playlist.fallbackCoverUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                  onClick={onCreatePlaylist}
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
                  onClick={() => setViewState({ type: 'home', filterTab: 'podcasts' })}
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
          className={`flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/20 hover:border-white text-white h-8 rounded-full text-xs font-bold transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer backdrop-blur-md overflow-hidden ${
            isShutterOpen ? 'px-3.5 w-auto' : 'w-12 justify-center px-0'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span
            className={`whitespace-nowrap transition-all duration-300 ${
              isShutterOpen ? 'opacity-100 max-w-[80px]' : 'opacity-0 max-w-0 hidden'
            }`}
          >
            English
          </span>
        </button>
      </div>
    </aside>
  );
};
