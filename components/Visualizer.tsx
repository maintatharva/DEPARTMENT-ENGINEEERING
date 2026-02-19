import React, { useEffect, useRef } from 'react';
import { ConnectionState } from '../types';

interface VisualizerProps {
  volume: number;
  state: ConnectionState;
}

const Visualizer: React.FC<VisualizerProps> = ({ volume, state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (state !== ConnectionState.CONNECTED) {
        // Idle state: flat line or gentle pulse
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.strokeStyle = '#334155'; // Slate 700
        ctx.lineWidth = 2;
        ctx.lineTo(width, centerY);
        ctx.stroke();
      } else {
        // Active state: sine wave based on volume
        ctx.beginPath();
        ctx.strokeStyle = volume > 0.01 ? '#10b981' : '#334155'; // Emerald 500 or Slate
        ctx.lineWidth = 3;
        
        // Dynamic amplitude based on volume
        const amplitude = Math.max(10, volume * 150); 
        const frequency = 0.05;
        
        ctx.moveTo(0, centerY);
        
        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * frequency + phase) * amplitude * Math.sin(x / width * Math.PI);
          ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        
        // Speed varies with volume slightly
        phase += 0.2 + (volume * 0.5);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, volume]);

  return (
    <div className="w-full h-32 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden shadow-inner backdrop-blur-sm">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={128} 
        className="w-full h-full"
      />
    </div>
  );
};

export default Visualizer;
