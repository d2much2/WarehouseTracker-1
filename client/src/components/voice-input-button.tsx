import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscript, className }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const toggleListening = async () => {
    console.log('[VoiceInput] Toggle listening clicked');
    console.log('[VoiceInput] Browser supports speech:', browserSupportsSpeechRecognition);
    console.log('[VoiceInput] Microphone available:', isMicrophoneAvailable);
    console.log('[VoiceInput] Is secure context:', window.isSecureContext);
    console.log('[VoiceInput] Protocol:', window.location.protocol);

    if (!browserSupportsSpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (!isMicrophoneAvailable) {
      console.log('[VoiceInput] Attempting to request microphone permission manually');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('[VoiceInput] Manual permission request succeeded');
        
        toast({
          title: "Permission Granted",
          description: "Please click the microphone button again to start voice input.",
        });
        return;
      } catch (error: any) {
        console.error('[VoiceInput] Manual permission request failed:', error);
        
        let description = "Please allow microphone access to use voice input.";
        if (!window.isSecureContext) {
          description = "Microphone requires HTTPS. Please access this app via a secure connection.";
        } else if (error.name === 'NotAllowedError') {
          description = "Microphone access was denied. Please check your browser settings.";
        } else if (error.name === 'NotFoundError') {
          description = "No microphone device found. Please connect a microphone.";
        }
        
        toast({
          title: "Microphone Access Required",
          description,
          variant: "destructive",
        });
        return;
      }
    }

    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      if (transcript) {
        onTranscript(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
      setIsListening(true);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "outline"}
      onClick={toggleListening}
      className={className}
      data-testid="button-voice-input"
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
