import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
  voiceSettings?: {
    stability: number;
    similarity_boost: number;
    use_speaker_boost: boolean;
    style: number;
  };
}

export interface TTSCallbacks {
  onStart?: () => void;
  onLoading?: (isLoading: boolean) => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

class ElevenLabsStreamingService {
  private static instance: ElevenLabsStreamingService;
  private websocketRef: WebSocket | null = null;
  private soundRef: Audio.Sound | null = null;
  private audioBufferRef: string[] = [];
  private consumedChunksRef = 0; // Track how many chunks have been consumed
  private isProcessingRef = false;
  private isStreamCompleteRef = false;
  private isUpdatingRef = false;
  private isSpeaking = false;
  private isLoading = false;
  private isPaused = false;
  private pausedPosition = 0;
  private callbacks: TTSCallbacks = {};

  private config: ElevenLabsConfig = {
    apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
    voiceId: process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || 'qS8z9VGvq5TIqGvrjctF', // Default voice
    model: process.env.EXPO_PUBLIC_ELEVENLABS_MODEL || 'eleven_flash_v2_5',
    voiceSettings: {
      stability: 0.5,
      similarity_boost: 0.8,
      use_speaker_boost: true,
      style: 1.0,
    }
  };

  public static getInstance(): ElevenLabsStreamingService {
    if (!ElevenLabsStreamingService.instance) {
      ElevenLabsStreamingService.instance = new ElevenLabsStreamingService();
    }
    return ElevenLabsStreamingService.instance;
  }

  private constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error initializing audio mode:', error);
    }
  }

  public setCallbacks(callbacks: TTSCallbacks) {
    this.callbacks = callbacks;
  }

  public updateConfig(config: Partial<ElevenLabsConfig>) {
    this.config = { ...this.config, ...config };
  }

  private log(message: string, data?: any) {
    console.log(`[ElevenLabs] ${message}`, data || '');
  }

  private markdownToText(markdown: string): string {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/#{1,6}\s*(.*)/g, '$1') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/\n+/g, ' ') // Multiple newlines to space
      .trim();
  }

  public async speak(text: string): Promise<void> {
    try {
      this.log("Starting speak", {
        textLength: text.length,
        isSpeaking: this.isSpeaking,
        isProcessing: this.isProcessingRef,
      });

      if (this.isSpeaking || this.isProcessingRef) {
        this.log("Stopping current audio before new playback");
        await this.stopCurrentAudio();
        return;
      }

      if (!this.config.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      this.isProcessingRef = true;
      this.isStreamCompleteRef = false;
      this.isLoading = true;
      this.callbacks.onStart?.();
      this.callbacks.onLoading?.(true);

      const plainText = this.markdownToText(text);
      this.log("Processed text:", { length: plainText.length });

      await this.setAudioMode();
      await this.initializeWebSocket(plainText);

    } catch (error) {
      console.error("Error in speak:", error);
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
      await this.stopCurrentAudio();
    }
  }

  private async setAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  private async initializeWebSocket(text: string) {
    const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream-input?model_id=${this.config.model}`;
    
    this.websocketRef = new WebSocket(uri);
    this.audioBufferRef = [];
    this.consumedChunksRef = 0; // Reset consumed chunks for new session

    let isFirstPlay = true;
    let accumulatedChunks = 0;
    const MIN_CHUNKS_TO_PLAY = 3;

    this.websocketRef.onopen = () => {
      this.log("WebSocket opened, sending initial config");
      this.websocketRef?.send(
        JSON.stringify({
          text: " ",
          voice_settings: this.config.voiceSettings,
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290],
            stream_chunk_size: 2048,
          },
          xi_api_key: this.config.apiKey,
        })
      );

      // Send text in chunks
      const chunkSize = 1000;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        this.websocketRef?.send(JSON.stringify({ text: chunk }));
      }

      // Send empty text to signal end
      this.websocketRef?.send(JSON.stringify({ text: "" }));
    };

    this.websocketRef.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.audio) {
          this.audioBufferRef.push(data.audio);
          accumulatedChunks++;
          this.log("Received audio chunk", {
            chunk: accumulatedChunks,
            bufferLength: this.audioBufferRef.length,
            isFirstPlay,
            isUpdating: this.isUpdatingRef,
            isStreamComplete: this.isStreamCompleteRef,
          });

          if (isFirstPlay && accumulatedChunks >= MIN_CHUNKS_TO_PLAY) {
            this.log("Starting initial playback");
            isFirstPlay = false;
            await this.playAudioFromBuffer();
          }
          // Removed streaming updates - let audio play completely without interruption
          // All remaining chunks will be played after initial audio finishes naturally
        }

        if (data.isFinal) {
          this.log("Received final flag", {
            bufferedChunks: this.audioBufferRef.length,
            isFirstPlay,
            isUpdating: this.isUpdatingRef,
          });
          this.isStreamCompleteRef = true;

          // Don't interrupt current audio for final update - let it finish naturally
          // The audio completion handler will detect isStreamCompleteRef and handle completion
          this.log("Stream complete - letting current audio finish naturally");

          if (this.websocketRef) {
            this.websocketRef.close();
            this.websocketRef = null;
          }
        }
      } catch (error) {
        console.error("Error processing audio chunk:", error);
        this.callbacks.onError?.('Error processing audio stream');
      }
    };

    this.websocketRef.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.callbacks.onError?.('WebSocket connection failed');
      this.stopCurrentAudio();
    };

    this.websocketRef.onclose = () => {
      if (isFirstPlay && this.audioBufferRef.length > 0) {
        isFirstPlay = false;
        this.playAudioFromBuffer();
      }
      this.isLoading = false;
      this.callbacks.onLoading?.(false);
    };
  }

  private async playAudioFromBuffer() {
    try {
      this.log("Starting playAudioFromBuffer", {
        bufferLength: this.audioBufferRef.length,
      });
      
      if (!this.audioBufferRef.length) {
        this.log("No audio in buffer");
        return;
      }

      // Store the number of chunks being used for initial playback
      const chunksForInitialPlayback = this.audioBufferRef.length;
      const base64Data = this.audioBufferRef.slice(0, chunksForInitialPlayback).join("");
      const audioUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`;
      this.log("Creating audio file", { 
        uri: audioUri,
        chunksUsed: chunksForInitialPlayback 
      });

      await FileSystem.writeAsStringAsync(audioUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 50,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        async (status: AVPlaybackStatus) => {
          if ((status as AVPlaybackStatusSuccess).didJustFinish) {
            this.log("Audio finished playing", {
              isStreamComplete: this.isStreamCompleteRef,
              bufferedChunks: this.audioBufferRef.length,
              consumedChunks: chunksForInitialPlayback,
            });
            
            await FileSystem.deleteAsync(audioUri, { idempotent: true });
            
            if (this.isStreamCompleteRef) {
              // Check if there are NEW chunks that arrived after initial playback started
              const remainingChunks = this.audioBufferRef.slice(chunksForInitialPlayback);
              if (remainingChunks.length > 0) {
                this.log("Playing remaining chunks after initial audio finished", {
                  remainingChunksCount: remainingChunks.length,
                  totalChunks: this.audioBufferRef.length,
                  initialChunks: chunksForInitialPlayback,
                });
                // Play the remaining chunks
                await this.playRemainingChunks(remainingChunks);
              } else {
                // No remaining chunks, complete the session
                this.isSpeaking = false;
                this.isProcessingRef = false;
                this.callbacks.onSpeaking?.(false);
                this.callbacks.onComplete?.();
              }
            } else {
              this.log("Stream not complete, continuing playback");
            }
          }
        }
      );

      this.soundRef = newSound;
      this.isSpeaking = true;
      this.isLoading = false;
      this.callbacks.onSpeaking?.(true);
      this.callbacks.onLoading?.(false);
      
      // Update consumed chunks to reflect what was used in initial playback
      this.consumedChunksRef = chunksForInitialPlayback;
      
      this.log("Initial audio playback started", {
        consumedChunks: this.consumedChunksRef,
        totalBufferLength: this.audioBufferRef.length
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      this.callbacks.onError?.('Error playing audio');
      await this.stopCurrentAudio();
    }
  }

  private async playRemainingChunks(remainingChunks: string[]) {
    try {
      this.log("Starting playRemainingChunks", {
        remainingChunksCount: remainingChunks.length,
      });

      const base64Data = remainingChunks.join("");
      const audioUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`;
      this.log("Creating remaining chunks audio file", { uri: audioUri });

      await FileSystem.writeAsStringAsync(audioUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 50,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        async (status: AVPlaybackStatus) => {
          if ((status as AVPlaybackStatusSuccess).didJustFinish) {
            this.log("Remaining chunks finished playing");
            
            // Complete the session
            this.isSpeaking = false;
            this.isProcessingRef = false;
            this.callbacks.onSpeaking?.(false);
            this.callbacks.onComplete?.();
            
            await FileSystem.deleteAsync(audioUri, { idempotent: true });
          }
        }
      );

      // Replace the current sound with the remaining chunks
      const oldSound = this.soundRef;
      this.soundRef = newSound;

      if (oldSound) {
        await oldSound.stopAsync();
        await oldSound.unloadAsync();
      }

      this.log("Started playing remaining chunks");
    } catch (error) {
      console.error("Error playing remaining chunks:", error);
      this.callbacks.onError?.('Error playing remaining audio');
      await this.stopCurrentAudio();
    }
  }

  private async updateAudioPlayback() {
    try {
      this.log("Starting updateAudioPlayback", {
        hasSound: !!this.soundRef,
        bufferLength: this.audioBufferRef.length,
        consumedChunks: this.consumedChunksRef,
        isUpdating: this.isUpdatingRef,
        isStreamComplete: this.isStreamCompleteRef,
      });

      if (
        !this.soundRef ||
        !this.audioBufferRef.length ||
        this.isUpdatingRef
      ) {
        this.log("Skipping update due to conditions not met");
        return;
      }

      this.isUpdatingRef = true;
      const status = await this.soundRef.getStatusAsync();
      const playbackStatus = status as AVPlaybackStatusSuccess;

      this.log("Current playback status", {
        position: playbackStatus.positionMillis,
        duration: playbackStatus.durationMillis,
        isPlaying: playbackStatus.isPlaying,
        isStreamComplete: this.isStreamCompleteRef,
      });

      if (
        !this.isStreamCompleteRef &&
        playbackStatus.isPlaying &&
        playbackStatus.durationMillis &&
        playbackStatus.positionMillis &&
        playbackStatus.durationMillis - playbackStatus.positionMillis > 2000
      ) {
        this.log("Skipping update, sufficient audio remaining and not final");
        this.isUpdatingRef = false;
        return;
      }

      // Only use new chunks that haven't been consumed yet
      const newChunks = this.audioBufferRef.slice(this.consumedChunksRef);
      if (newChunks.length === 0 && !this.isStreamCompleteRef) {
        this.log("No new chunks to process");
        this.isUpdatingRef = false;
        return;
      }

      // Always use only new chunks to avoid duplication
      const chunksToUse = newChunks.length > 0 ? newChunks : this.audioBufferRef.slice(this.consumedChunksRef);
      const base64Data = chunksToUse.join("");
      const audioUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`;

      this.log("Creating new audio file for update", {
        isStreamComplete: this.isStreamCompleteRef,
        currentPosition: playbackStatus.positionMillis,
        newChunksCount: newChunks.length,
        totalChunksUsed: chunksToUse.length,
      });

      await FileSystem.writeAsStringAsync(audioUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 50,
          positionMillis: 0, // Always start new chunks from beginning
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        async (status: AVPlaybackStatus) => {
          if ((status as AVPlaybackStatusSuccess).didJustFinish) {
            this.log("Audio update finished playing", {
              isStreamComplete: this.isStreamCompleteRef,
              bufferedChunks: this.audioBufferRef.length,
            });
            if (this.isStreamCompleteRef) {
              this.isSpeaking = false;
              this.isProcessingRef = false;
              this.callbacks.onSpeaking?.(false);
              this.callbacks.onComplete?.();
            }
            await FileSystem.deleteAsync(audioUri, { idempotent: true });
          }
        }
      );

      const oldSound = this.soundRef;
      this.soundRef = newSound;

      if (oldSound) {
        await oldSound.stopAsync();
        await oldSound.unloadAsync();
      }

      // Update consumed chunks count only if not final update
      if (!this.isStreamCompleteRef) {
        this.consumedChunksRef = this.audioBufferRef.length;
      }

      this.log("Created new audio instance for update", {
        isStreamComplete: this.isStreamCompleteRef,
        consumedChunks: this.consumedChunksRef,
      });
    } catch (error) {
      console.error("Error updating audio:", error);
      this.callbacks.onError?.('Error updating audio playback');
    } finally {
      this.isUpdatingRef = false;
    }
  }

  public async stopCurrentAudio() {
    try {
      this.log("Stopping current audio");
      
      if (this.websocketRef) {
        this.websocketRef.close();
        this.websocketRef = null;
      }

      if (this.soundRef) {
        await this.soundRef.stopAsync();
        await this.soundRef.unloadAsync();
        this.soundRef = null;
      }

      // Clean up temporary files
      try {
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          const audioFiles = files.filter(file => file.startsWith('temp_audio_'));
          for (const file of audioFiles) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
          }
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up audio files:', cleanupError);
      }

      this.audioBufferRef = [];
      this.consumedChunksRef = 0; // Reset consumed chunks counter
      this.isProcessingRef = false;
      this.isStreamCompleteRef = false;
      this.isUpdatingRef = false;
      this.isSpeaking = false;
      this.isLoading = false;
      this.isPaused = false;
      this.pausedPosition = 0;
      
      this.callbacks.onSpeaking?.(false);
      this.callbacks.onLoading?.(false);
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  public isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  public async pause() {
    try {
      if (this.soundRef && this.isSpeaking && !this.isPaused) {
        const status = await this.soundRef.getStatusAsync();
        if (status.isLoaded && (status as AVPlaybackStatusSuccess).isPlaying) {
          this.pausedPosition = (status as AVPlaybackStatusSuccess).positionMillis || 0;
          await this.soundRef.pauseAsync();
          this.isPaused = true;
          this.log("Audio paused", { position: this.pausedPosition });
        }
      }
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }

  public async resume() {
    try {
      if (this.soundRef && this.isSpeaking && this.isPaused) {
        await this.soundRef.playAsync();
        this.isPaused = false;
        this.log("Audio resumed", { position: this.pausedPosition });
      }
    } catch (error) {
      console.error("Error resuming audio:", error);
    }
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public async destroy() {
    await this.stopCurrentAudio();
    this.callbacks = {};
  }
}

// Export singleton instance
export const elevenLabsService = ElevenLabsStreamingService.getInstance();
export default elevenLabsService;
