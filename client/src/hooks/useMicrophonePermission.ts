import { useEffect, useState, useRef } from "react";

let hasSuccessfullyRequested = false;

export function useMicrophonePermission() {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const hasInitialized = useRef(false);
  const hasAttemptedRequest = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;

    const requestMicrophoneAccess = async () => {
      if (hasSuccessfullyRequested || hasAttemptedRequest.current) {
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      if (document.visibilityState !== 'visible') {
        return;
      }

      hasAttemptedRequest.current = true;

      try {
        setIsRequesting(true);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        hasSuccessfullyRequested = true;
        setPermissionStatus('granted');
      } catch (error: any) {
        if (error.name === 'NotFoundError') {
          setPermissionStatus('denied');
          hasSuccessfullyRequested = true;
        } else {
          setPermissionStatus('prompt');
        }
      } finally {
        setIsRequesting(false);
      }
    };

    const checkAndRequestPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus('denied');
        return;
      }

      try {
        if ('permissions' in navigator) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          setPermissionStatus(permissionResult.state as 'granted' | 'denied' | 'prompt');
          
          if (permissionResult.state === 'granted') {
            hasSuccessfullyRequested = true;
            return;
          }
          
          if (permissionResult.state === 'denied') {
            hasSuccessfullyRequested = true;
            return;
          }
          
          permissionResult.onchange = () => {
            const newState = permissionResult.state as 'granted' | 'denied' | 'prompt';
            setPermissionStatus(newState);
            if (newState === 'granted' || newState === 'denied') {
              hasSuccessfullyRequested = true;
            }
          };
        }
      } catch (error) {
        // Permissions API not available (Safari) - continue to request
      }

      await requestMicrophoneAccess();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasSuccessfullyRequested && !hasAttemptedRequest.current) {
        requestMicrophoneAccess();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    checkAndRequestPermission();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { permissionStatus, isRequesting };
}
