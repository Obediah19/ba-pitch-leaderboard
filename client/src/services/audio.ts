// Audio Service with authentic Kenney CC0 audio assets + dual-channel mixer (SFX & Music)

class SoundSystem {
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.35;
  private isMuted: boolean = false;
  private lobbyAudio: HTMLAudioElement | null = null;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadSounds();
    }
  }

  private preloadSounds() {
    const sounds = ['tick.wav', 'lock.wav', 'join.ogg', 'correct.ogg', 'wrong.ogg', 'victory.ogg'];
    sounds.forEach(file => {
      const audio = new Audio(`/sounds/${file}`);
      audio.preload = 'auto';
      this.audioCache.set(file, audio);
    });

    this.lobbyAudio = new Audio('/sounds/lobby_music.wav');
    this.lobbyAudio.loop = true;
    this.lobbyAudio.volume = this.musicVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.lobbyAudio) {
      this.lobbyAudio.volume = this.isMuted ? 0 : this.musicVolume;
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.lobbyAudio) {
      this.lobbyAudio.volume = this.isMuted ? 0 : this.musicVolume;
      if (this.isMuted) {
        this.lobbyAudio.pause();
      } else {
        this.lobbyAudio.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  private playSfx(fileName: string) {
    if (this.isMuted || this.sfxVolume === 0) return;

    try {
      // Clone audio node to allow overlapping rapid sound playback
      const audio = new Audio(`/sounds/${fileName}`);
      audio.volume = this.sfxVolume;
      audio.play().catch(err => {
        console.warn('Audio playback prevented by browser autoplay policy:', err);
      });
    } catch (e) {
      console.warn('Could not play sound:', fileName, e);
    }
  }

  // Pre-configured Sound Triggers
  public playTick() {
    this.playSfx('tick.wav');
  }

  public playLock() {
    this.playSfx('lock.wav');
  }

  public playJoin() {
    this.playSfx('join.ogg');
  }

  public playCorrect() {
    this.playSfx('correct.ogg');
  }

  public playWrong() {
    this.playSfx('wrong.ogg');
  }

  public playVictory() {
    this.playSfx('victory.ogg');
  }

  // Background Lobby Music Control
  public startLobbyMusic() {
    if (this.isMuted || !this.lobbyAudio) return;
    this.lobbyAudio.currentTime = 0;
    this.lobbyAudio.volume = this.musicVolume;
    this.lobbyAudio.play().catch(() => {
      // Browser will require user interaction first
    });
  }

  public stopLobbyMusic() {
    if (this.lobbyAudio) {
      this.lobbyAudio.pause();
    }
  }
}

export const sound = new SoundSystem();
