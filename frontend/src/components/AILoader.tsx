import { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface AILoaderProps {
  message?: string;
}

const AILoader: React.FC<AILoaderProps> = ({ message }) => {
  const { t } = useTranslation();
  const defaultMessage = message || t('processing.title');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);
  const dotsRef = useRef(0);
  const pulseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Glowing inner ring with pulse effect
      const pulseSize = 80 + Math.sin(pulseRef.current) * 20;
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseSize);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
      gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.4)");
      gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Primary rotating ring
      ctx.strokeStyle = "rgba(99, 102, 241, 0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, angleRef.current, angleRef.current + Math.PI);
      ctx.stroke();

      // Secondary ring rotating in reverse
      ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, -angleRef.current * 1.5, -angleRef.current * 1.5 + Math.PI / 1.5);
      ctx.stroke();

      // Dashed outer ring
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 100, angleRef.current * 0.5, angleRef.current * 0.5 + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating dots
      for (let i = 0; i < 6; i++) {
        const dotAngle = angleRef.current * 2 + (i * Math.PI) / 3;
        const dotX = cx + Math.cos(dotAngle) * 45;
        const dotY = cy + Math.sin(dotAngle) * 45;
        
        ctx.fillStyle = `rgba(99, 102, 241, ${0.5 + 0.5 * Math.sin(dotAngle)})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animation loop
      angleRef.current += 0.04;
      pulseRef.current += 0.08;
      if (Math.random() < 0.03) dotsRef.current++;

      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-100" dir="rtl">
      <div className="relative">
        <canvas ref={canvasRef} width={250} height={250} className="drop-shadow-lg" />
        
        {/* AI Icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-pulse">🤖</div>
        </div>
      </div>
      
      {/* Loading text with animated dots */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-semibold text-indigo-700 mb-2">
          {defaultMessage}
        </h3>
        <p className="text-indigo-600 text-lg">
          {t('loading.dataLoading')}{".".repeat((dotsRef.current % 4) + 1)}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-500">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AILoader;