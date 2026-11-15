import React, { useState } from 'react';
import { X, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('My Playlist #1');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="animate-modal-pop bg-[#181c24]/95 backdrop-blur-2xl text-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/15">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold">Edit details</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#b3b3b3] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto sm:mx-0 bg-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-[#727272] shrink-0 border border-white/10 shadow-inner">
              <Music className="w-10 h-10 sm:w-12 sm:h-12 mb-1" />
              <span className="text-xs">Choose photo</span>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1">Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Add a name"
                  className="w-full bg-white/[0.08] text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add an optional description"
                  rows={3}
                  className="w-full bg-white/[0.08] text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-white/40 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-[#a7a7a7] max-w-xs">
              By proceeding, you agree to give Spotify access to the image you choose to upload.
            </p>
            <button
              type="submit"
              className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform shadow cursor-pointer self-end sm:self-auto"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
