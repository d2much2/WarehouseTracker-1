import { Input } from "@/components/ui/input";
import { VoiceInputButton } from "@/components/voice-input-button";
import { forwardRef } from "react";

export interface InputWithVoiceProps extends React.ComponentPropsWithoutRef<typeof Input> {
  onVoiceTranscript?: (text: string) => void;
  showVoiceButton?: boolean;
}

export const InputWithVoice = forwardRef<HTMLInputElement, InputWithVoiceProps>(
  ({ onVoiceTranscript, showVoiceButton = true, ...props }, ref) => {
    if (!showVoiceButton) {
      return <Input ref={ref} {...props} />;
    }

    return (
      <div className="flex gap-2 flex-1">
        <Input ref={ref} {...props} className="flex-1" />
        {onVoiceTranscript && (
          <VoiceInputButton onTranscript={onVoiceTranscript} />
        )}
      </div>
    );
  }
);

InputWithVoice.displayName = "InputWithVoice";
