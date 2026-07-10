import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, usePlaybackStore } from '../../stores';
import { loadAudioFromFile, getAudioElement } from '../../services/audioService';

export const AudioPlayer = observer(function AudioPlayer() {
  const project = useProjectStore();
  const playback = usePlaybackStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await loadAudioFromFile(file);
    project.setAudioFile(url);
    playback.attachAudio(getAudioElement());
  };

  const hasAudio = !!project.project.audioFile;
  const currentSec = Math.floor(playback.currentTimeMs / 1000);
  const totalSec = Math.floor(playback.duration / 1000);
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      {!hasAudio ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-dashed border-white/15 rounded-lg text-sm text-white/40 hover:text-white/60 hover:border-white/25 transition-colors"
          >
            Upload audio file
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => playback.togglePlayback()}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"
            >
              {playback.isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="1" y="1" width="3.5" height="10" rx="0.5" />
                  <rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 1L10.5 6L2.5 11V1Z" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={playback.duration || 1}
                value={playback.currentTimeMs}
                onChange={(e) => playback.seek(Number(e.target.value))}
                className="w-full h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <span className="text-xs text-white/40 tabular-nums min-w-[70px] text-right">
              {formatTime(currentSec)} / {formatTime(totalSec)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">Speed:</span>
            {[0.5, 0.75, 1, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => playback.setPlaybackRate(rate)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  playback.playbackRate === rate
                    ? 'bg-white/15 text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
