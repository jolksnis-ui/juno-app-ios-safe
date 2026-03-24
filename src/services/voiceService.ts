import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
} from '@react-native-community/voice';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import elevenLabsService from './elevenLabsService';

export interface VoiceServiceCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechResults?: (results: string[]) => void;
  onSpeechError?: (error: any) => void;
  onSpeechPartialResults?: (results: string[]) => void;
}

class VoiceService {
  private isInitialized = false;
  private isListening = false;
  private callbacks: VoiceServiceCallbacks = {};

  constructor() {
    this.initializeVoice();
  }

  private initializeVoice = () => {
    if (this.isInitialized) return;

    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechRecognized = this.onSpeechRecognized;

    this.isInitialized = true;
  };

  private onSpeechStart = async (event: SpeechStartEvent) => {
    console.log('Voice: Speech started');
    
    // Stop any ongoing TTS playback when user starts speaking
    if (elevenLabsService.isCurrentlySpeaking() || elevenLabsService.isCurrentlyLoading()) {
      console.log('Voice: Stopping TTS playback due to user speech input');
      await elevenLabsService.stopCurrentAudio();
    }
    
    this.isListening = true;
    this.callbacks.onSpeechStart?.();
  };

  private onSpeechEnd = (event: SpeechEndEvent) => {
    console.log('Voice: Speech ended');
    this.isListening = false;
    this.callbacks.onSpeechEnd?.();
  };

  private onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('Voice: Speech results', event.value);
    if (event.value && event.value.length > 0) {
      this.callbacks.onSpeechResults?.(event.value);
      // Don't auto-stop here - let the user control when to stop
      // or let the system naturally end when speech stops
    }
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent) => {
    console.log('Voice: Partial results', event.value);
    if (event.value && event.value.length > 0) {
      this.callbacks.onSpeechPartialResults?.(event.value);
    }
  };

  private onSpeechError = (event: SpeechErrorEvent) => {
    console.log('Voice: Speech error', event.error);
    this.isListening = false;
    this.callbacks.onSpeechError?.(event.error);
  };

  private onSpeechRecognized = (event: SpeechRecognizedEvent) => {
    console.log('Voice: Speech recognized');
  };

  public setCallbacks = (callbacks: VoiceServiceCallbacks) => {
    this.callbacks = callbacks;
  };

  public requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Juno needs access to your microphone to enable voice input for the AI assistant.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // iOS permissions are handled automatically when first accessing microphone
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  public startListening = async (locale: string = 'en-US'): Promise<boolean> => {
    try {
      if (this.isListening) {
        console.log('Voice: Already listening - attempting to reset');
        // Force reset if stuck in listening state
        await this.forceReset();
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone access is required for voice input. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Check if voice recognition is available
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition is not available on this device.',
          [{ text: 'OK' }]
        );
        return false;
      }

      await Voice.start(locale, {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_MAX_RESULTS: 5,
        EXTRA_PARTIAL_RESULTS: true,
        REQUEST_PERMISSIONS_AUTO: true,
      });

      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.callbacks.onSpeechError?.(error);
      return false;
    }
  };

  public stopListening = async (): Promise<void> => {
    try {
      if (!this.isListening) {
        console.log('Voice: Not currently listening');
        return;
      }

      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      this.callbacks.onSpeechError?.(error);
    }
  };

  public cancelListening = async (): Promise<void> => {
    try {
      await Voice.cancel();
      this.isListening = false;
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
    }
  };

  public forceReset = async (): Promise<void> => {
    try {
      console.log('Voice: Force resetting voice service');
      await Voice.cancel();
      this.isListening = false;
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error force resetting voice service:', error);
      // Force reset the state even if cancel fails
      this.isListening = false;
    }
  };

  public isCurrentlyListening = (): boolean => {
    return this.isListening;
  };

  public destroy = async (): Promise<void> => {
    try {
      await Voice.destroy();
      this.isInitialized = false;
      this.isListening = false;
      this.callbacks = {};
    } catch (error) {
      console.error('Error destroying voice service:', error);
    }
  };

  // Get available locales for speech recognition
  public getSupportedLocales = async (): Promise<string[]> => {
    try {
      const locales = await Voice.getSpeechRecognitionServices();
      return locales || ['en-US'];
    } catch (error) {
      console.error('Error getting supported locales:', error);
      return ['en-US'];
    }
  };
}

// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;
