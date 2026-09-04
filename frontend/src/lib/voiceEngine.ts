// ─── Browser Native Voice Engine (Zero-Cost STT & TTS) ─────────────────────────
// Utilizes the W3C Web Speech API (SpeechRecognition & SpeechSynthesis)
// Runs 100% on client hardware with 0 cloud latency or third-party audio costs.

class VoiceEngine {
  private recognition: any = null;
  private isListeningActive = false;

  // ── Speech-To-Text (STT) ─────────────────────────────────────────────────────
  public isSTTSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public startListening({
    onTranscript,
    onListening,
    onError,
    onEnd,
    language = 'en-US',
  }: {
    onTranscript: (text: string, isFinal: boolean) => void;
    onListening?: (listening: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
    language?: string;
  }): boolean {
    if (!this.isSTTSupported()) {
      onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionConstructor();
      this.recognition = recognition;
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isListeningActive = true;
        onListening?.(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          onTranscript(currentText, Boolean(finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceEngine] STT Error:', event.error);
        if (event.error !== 'no-speech') {
          onError?.(event.error);
        }
        onListening?.(false);
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        onListening?.(false);
        onEnd?.();
      };

      recognition.start();
      return true;
    } catch (err: any) {
      console.error('[VoiceEngine] Failed to start recognition:', err);
      onError?.(err?.message || 'Failed to start microphone');
      onListening?.(false);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.isListeningActive = false;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  // ── Text-To-Speech (TTS) ─────────────────────────────────────────────────────
  public isTTSSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  /**
   * Cleans raw markdown symbols, code fences, URLs, and links for natural human audio readout.
   */
  public cleanMarkdownForVoice(text: string): string {
    if (!text) return '';
    return text
      // Replace code blocks with brief spoken summaries
      .replace(/```[\s\S]*?```/g, ' [code block] ')
      // Replace inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold and italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove Markdown links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blockquotes and list bullets
      .replace(/^\s*>\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove horizontal rules
      .replace(/^-{3,}$/gm, '')
      // Collapse excess whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  public cleanMarkdownForSpeech(text: string): string {
    return this.cleanMarkdownForVoice(text);
  }


  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      rate?: number;
      pitch?: number;
      voiceName?: string;
    }
  ): void {
    if (!this.isTTSSupported()) {
      options?.onError?.('Speech synthesis is not supported in this browser.');
      return;
    }

    this.stopSpeaking();

    const cleaned = this.cleanMarkdownForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.lang = 'en-US';

    // Pick natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = (e) => options?.onError?.(e);

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (!this.isTTSSupported()) return false;
    return window.speechSynthesis.speaking;
  }
}

export const voiceEngine = new VoiceEngine();
