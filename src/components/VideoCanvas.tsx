import React, { useEffect, useRef } from 'react';
import { GreetingFormData, VideoTemplate } from '../types';

interface VideoCanvasProps {
  formData: GreetingFormData;
  template: VideoTemplate;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width?: number;  // Default 1080
  height?: number; // Default 1920
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  formData,
  template,
  canvasRef,
  width = 1080,
  height = 1920
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load template video background
  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = template.videoPath;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = 'anonymous';
    vid.play().catch(() => {});
    videoRef.current = vid;

    return () => {
      vid.pause();
      videoRef.current = null;
    };
  }, [template.videoPath]);

  // Preload single photo
  useEffect(() => {
    if (!formData.photo) {
      imageRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = formData.photo;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [formData.photo]);

  // Canvas Continuous Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = width;
          canvas.height = height;

          // Clear
          ctx.clearRect(0, 0, width, height);

          // 1. Render Template Video Background
          if (videoRef.current && videoRef.current.readyState >= 2) {
            ctx.drawImage(videoRef.current, 0, 0, width, height);
          } else {
            // Fallback gradient if video is loading
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#1c060a');
            grad.addColorStop(1, '#330c00');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
          }

          // 2. Render Single Photo masked inside exact circular area
          // Photo Specs: X=131.1, Y=551.1, W=817.7, H=817.7
          const pX = template.photoX || 131.1;
          const pY = template.photoY || 551.1;
          const pW = template.photoWidth || 817.7;
          const pH = template.photoHeight || 817.7;
          const centerX = pX + pW / 2;
          const centerY = pY + pH / 2;
          const radius = pW / 2;

          ctx.save();
          // Circular Clip Path
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          if (imageRef.current && imageRef.current.complete) {
            const img = imageRef.current;
            // Aspect fill calculation inside pW x pH
            const imgAspect = img.width / img.height;
            const boxAspect = pW / pH;
            let drawW = pW;
            let drawH = pH;
            let drawX = pX;
            let drawY = pY;

            if (imgAspect > boxAspect) {
              drawW = pH * imgAspect;
              drawX = pX - (drawW - pW) / 2;
            } else {
              drawH = pW / imgAspect;
              drawY = pY - (drawH - pH) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
          } else {
            // Placeholder user photo area
            ctx.fillStyle = '#2A2620';
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px "Laila", "Noto Sans Devanagari", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Upload Photo', centerX, centerY);
          }
          ctx.restore();

          // 3. Render Single Name inside exact Name Area
          // Name Specs: X=108, Y=1360, W=922.8, H=313.9
          const nX = template.nameX || 108;
          const nY = (template.nameY || 1333.9) + 26;
          const nW = template.nameWidth || 922.8;
          const nH = template.nameHeight || 313.9;
          const nameCenterX = nX + nW / 2;
          const nameCenterY = nY + nH / 2;

          const nameText = formData.name || 'Your Name';

          ctx.save();
          // Dynamic font size calculation (substantially increased size)
          let fontSize = 132;
          if (nameText.length > 8) fontSize = 110;
          if (nameText.length > 14) fontSize = 88;
          if (nameText.length > 20) fontSize = 70;

          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 16;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 4;
          ctx.font = `bold ${fontSize}px "Noto Sans Devanagari", "Noto Sans Gujarati", "Noto Sans Bengali", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Gurmukhi", "Noto Sans Oriya", "Noto Sans Arabic", "Noto Sans", "Laila", "Yatra One", "Poppins", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nameText, nameCenterX, nameCenterY);
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [formData, template, canvasRef, width, height]);

  return (
    <div className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border-2 border-[#C5A059]/60 shadow-2xl flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain rounded-3xl bg-white text-white"
        style={{ backgroundColor: '#ffffff', color: '#ffffff' }}
      />
    </div>
  );
};
