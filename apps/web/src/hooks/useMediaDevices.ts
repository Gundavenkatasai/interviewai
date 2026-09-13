
import { useState, useEffect, useRef, useCallback } from "react";

export function useMediaDevices() {
  const [permissionState, setPermissionState] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>('prompt');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Audio context and analyser for level monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const updateDeviceList = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableCameras(devices.filter(d => d.kind === 'videoinput'));
      setAvailableMics(devices.filter(d => d.kind === 'audioinput'));
    } catch (err) {
      console.error("Failed to enumerate devices", err);
    }
  }, []);

  const monitorAudioLevel = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const context = audioContextRef.current;
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Convert 0-255 to 0-100
      const level = Math.min(100, Math.round((average / 255) * 100 * 1.5)); 
      
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, []);

  const requestPermissions = async () => {
    setPermissionState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const vStream = new MediaStream(stream.getVideoTracks());
      const aStream = new MediaStream(stream.getAudioTracks());
      
      setVideoStream(vStream);
      setAudioStream(aStream);
      
      setCameraEnabled(true);
      setMicEnabled(true);
      
      setPermissionState('granted');
      updateDeviceList();
      monitorAudioLevel(aStream);
      
      return stream;
    } catch (err) {
      console.error("Error requesting permissions", err);
      setPermissionState('denied');
      return null;
    }
  };

  const toggleCamera = () => {
    if (videoStream) {
      const tracks = videoStream.getVideoTracks();
      tracks.forEach(track => {
        track.enabled = !cameraEnabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMicrophone = () => {
    if (audioStream) {
      const tracks = audioStream.getAudioTracks();
      tracks.forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const selectCamera = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      
      if (videoStream) {
        videoStream.getVideoTracks().forEach(track => track.stop());
      }
      
      const newVStream = new MediaStream(stream.getVideoTracks());
      
      if (!cameraEnabled) {
        newVStream.getVideoTracks().forEach(track => track.enabled = false);
      }
      
      setVideoStream(newVStream);
    } catch (err) {
      console.error("Failed to select camera", err);
    }
  };

  const selectMic = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => track.stop());
      }
      
      const newAStream = new MediaStream(stream.getAudioTracks());
      
      if (!micEnabled) {
        newAStream.getAudioTracks().forEach(track => track.enabled = false);
      }
      
      setAudioStream(newAStream);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      monitorAudioLevel(newAStream);
    } catch (err) {
      console.error("Failed to select microphone", err);
    }
  };

  const cleanup = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
  }, [videoStream, audioStream]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (videoRef.current && videoStream && cameraEnabled) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, cameraEnabled]);

  return {
    requestPermissions,
    toggleCamera,
    toggleMicrophone,
    cameraEnabled,
    micEnabled,
    permissionState,
    videoStream,
    audioStream,
    availableCameras,
    availableMics,
    selectCamera,
    selectMic,
    audioLevel,
    videoRef,
    cleanup
  };
}
