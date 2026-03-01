let audioElement: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
  }
  return audioElement;
}

export function loadAudioFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = getAudioElement();
    audio.src = url;
    audio.load();
    resolve(url);
  });
}

export function disposeAudio() {
  if (audioElement) {
    audioElement.pause();
    if (audioElement.src.startsWith('blob:')) {
      URL.revokeObjectURL(audioElement.src);
    }
    audioElement.src = '';
    audioElement = null;
  }
}
