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
        console.log('[Microphone] Skipping request - already attempted or successful');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Microphone] getUserMedia not supported');
        return;
      }

      if (document.visibilityState !== 'visible') {
        console.log('[Microphone] Tab not visible - deferring request');
        return;
      }

      console.log('[Microphone] Requesting microphone access...');
      console.log('[Microphone] Context secure:', window.isSecureContext);
      console.log('[Microphone] Protocol:', window.location.protocol);
      console.log('[Microphone] Hostname:', window.location.hostname);

      hasAttemptedRequest.current = true;

      try {
        setIsRequesting(true);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        hasSuccessfullyRequested = true;
        setPermissionStatus('granted');
        console.log('[Microphone] Permission granted successfully');
      } catch (error: any) {
        console.error('[Microphone] Error requesting permission:', {
          name: error.name,
          message: error.message,
          isSecureContext: window.isSecureContext
        });
        
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
        console.error('[Microphone] MediaDevices API not available');
        setPermissionStatus('denied');
        return;
      }

      console.log('[Microphone] Initializing permission check');

      try {
        if ('permissions' in navigator) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          console.log('[Microphone] Current permission state:', permissionResult.state);
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
            console.log('[Microphone] Permission changed to:', newState);
            setPermissionStatus(newState);
            if (newState === 'granted' || newState === 'denied') {
              hasSuccessfullyRequested = true;
            }
          };
        }
      } catch (error) {
        console.log('[Microphone] Permissions API not available (Safari) - will request directly');
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
