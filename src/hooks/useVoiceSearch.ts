import { useCallback, useRef, useState } from 'react';

/** The slice of the Web Speech API this app relies on. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string;}>>;}) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognition(): RecognitionConstructor | undefined {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

export interface VoiceSearch {
  /** False in Firefox and in browsers that block the API — hide the affordance. */
  supported: boolean;
  listening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
}

/**
 * YouTube's "Search with your voice". Uses the browser's own speech engine —
 * nothing is uploaded by this app — and hands the final transcript to the
 * caller so it can run the same search path as typing.
 */
export function useVoiceSearch(onResult: (transcript: string) => void): VoiceSearch {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = typeof window !== 'undefined' && getRecognition() !== undefined;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const words = Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ');
      setTranscript(words.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      setTranscript((current) => {
        if (current) onResult(current);
        return '';
      });
    };

    setTranscript('');
    setListening(true);
    recognition.start();
  }, [onResult]);

  return { supported, listening, transcript, start, stop };
}