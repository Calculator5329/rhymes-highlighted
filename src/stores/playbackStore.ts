import { makeAutoObservable } from 'mobx';

export class PlaybackStore {
  isPlaying = false;
  currentTimeMs = 0;
  duration = 0;
  playbackRate = 1;

  private animationFrameId: number | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  attachAudio(audio: HTMLAudioElement) {
    this.detachAudio();
    this.audioElement = audio;

    audio.addEventListener('loadedmetadata', this.handleMetadata);
    audio.addEventListener('ended', this.handleEnded);
  }

  detachAudio() {
    if (this.audioElement) {
      this.audioElement.removeEventListener('loadedmetadata', this.handleMetadata);
      this.audioElement.removeEventListener('ended', this.handleEnded);
      this.stopTimeSync();
      this.audioElement = null;
    }
  }

  play() {
    if (!this.audioElement) return;
    this.audioElement.playbackRate = this.playbackRate;
    this.audioElement.play();
    this.isPlaying = true;
    this.startTimeSync();
  }

  pause() {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.isPlaying = false;
    this.stopTimeSync();
  }

  togglePlayback() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  seek(ms: number) {
    if (!this.audioElement) return;
    this.audioElement.currentTime = ms / 1000;
    this.currentTimeMs = ms;
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  getCurrentTimeMs(): number {
    if (this.audioElement) {
      return this.audioElement.currentTime * 1000;
    }
    return this.currentTimeMs;
  }

  private startTimeSync() {
    const sync = () => {
      if (this.audioElement) {
        this.currentTimeMs = this.audioElement.currentTime * 1000;
      }
      this.animationFrameId = requestAnimationFrame(sync);
    };
    sync();
  }

  private stopTimeSync() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private handleMetadata = () => {
    if (this.audioElement) {
      this.duration = this.audioElement.duration * 1000;
    }
  };

  private handleEnded = () => {
    this.isPlaying = false;
    this.stopTimeSync();
  };

  dispose() {
    this.detachAudio();
  }
}
