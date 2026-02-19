import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ConnectionState, TranscriptionItem } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION, VOICE_NAME } from '../constants';
import { createPcmBlob, decodeBase64, decodeAudioData } from '../utils/audioUtils';

export const useLiveSession = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  
  // Audio Queue Management
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Session
  const sessionRef = useRef<Promise<any> | null>(null);
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  const disconnect = useCallback(() => {
    // Close session
    if (sessionRef.current) {
      sessionRef.current.then(session => {
        try {
          session.close();
        } catch (e) {
          console.warn("Error closing session:", e);
        }
      });
      sessionRef.current = null;
    }

    // Stop all playing audio
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch(e) {}
    });
    activeSourcesRef.current.clear();

    // Stop and clean up microphone stream
    if (inputSourceRef.current && inputSourceRef.current.mediaStream) {
      inputSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      setTranscripts([]);

      if (!process.env.API_KEY) {
        throw new Error("API Key not found");
      }

      // 1. Browser Capability Check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support microphone access. Ensure you are using HTTPS.");
      }

      // 2. Hardware Detection
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some(device => device.kind === 'audioinput');
      if (!hasAudioInput) {
        throw new Error("No microphone detected. Please connect an audio input device and try again.");
      }

      // 3. Request Microphone Permissions
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          throw new Error("Requested microphone device not found. Please check your connections.");
        } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          throw new Error("Microphone permission denied. Please allow access in your browser settings.");
        } else {
          throw new Error(`Microphone access failed: ${e.message}`);
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            
            // Setup Input Pipeline
            if (!inputAudioContextRef.current) return;
            
            const ctx = inputAudioContextRef.current;
            inputSourceRef.current = ctx.createMediaStreamSource(stream);
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Volume estimation for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(rms);

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const serverContent = message.serverContent;
             if (serverContent) {
                if (serverContent.outputTranscription) {
                   currentOutputTranscriptionRef.current += serverContent.outputTranscription.text;
                }
                if (serverContent.inputTranscription) {
                   currentInputTranscriptionRef.current += serverContent.inputTranscription.text;
                }
                
                if (serverContent.turnComplete) {
                   const userText = currentInputTranscriptionRef.current.trim();
                   const aiText = currentOutputTranscriptionRef.current.trim();
                   
                   if (userText) {
                     setTranscripts(prev => [...prev, {
                       id: Date.now() + '-user',
                       text: userText,
                       sender: 'user',
                       timestamp: Date.now()
                     }]);
                   }
                   if (aiText) {
                     setTranscripts(prev => [...prev, {
                       id: Date.now() + '-ai',
                       text: aiText,
                       sender: 'ai',
                       timestamp: Date.now()
                     }]);
                   }
                   
                   currentInputTranscriptionRef.current = '';
                   currentOutputTranscriptionRef.current = '';
                }
             }

             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  decodeBase64(base64Audio),
                  ctx,
                  24000,
                  1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current);
                source.addEventListener('ended', () => {
                  activeSourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                activeSourcesRef.current.add(source);
                nextStartTimeRef.current += audioBuffer.duration;
             }
             
             if (message.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(src => {
                   try { src.stop(); } catch(e) {}
                });
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                currentOutputTranscriptionRef.current = '';
             }
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            setError("The industrial voice server reported an issue. Closing connection.");
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Connection Error:", err);
      setError(err.message || "Failed to establish maintenance link.");
      setConnectionState(ConnectionState.ERROR);
      disconnect();
    }
  }, [disconnect]);

  return {
    connect,
    disconnect,
    connectionState,
    transcripts,
    volume,
    error
  };
};