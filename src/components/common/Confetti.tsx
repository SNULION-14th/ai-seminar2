import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ['#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1'];

export const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles: Particle[] = Array.from({ length: 85 }, () => ({
      x: width * (0.3 + Math.random() * 0.4),
      y: height * 0.35,
      size: Math.random() * 8 + 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speedX: (Math.random() - 0.5) * 14,
      speedY: -Math.random() * 12 - 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let animationFrameId: number;
    let elapsed = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      elapsed += 1;

      let activeCount = 0;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.35; // Gravity
        p.rotation += p.rotationSpeed;

        if (elapsed > 60) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          activeCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (activeCount > 0 && elapsed < 180) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        onComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <div className="confetti-overlay" role="presentation" aria-hidden="true">
      <canvas ref={canvasRef} className="confetti-canvas" />
      <div className="celebration-toast">
        <span className="celebration-icon">🎉</span>
        <div className="celebration-text">
          <strong>All tasks completed!</strong>
          <span>Amazing job staying focused today.</span>
        </div>
      </div>
    </div>
  );
};
