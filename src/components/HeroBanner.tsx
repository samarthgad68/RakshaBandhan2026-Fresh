import React from 'react';
import { Sparkles, Video } from 'lucide-react';

interface HeroBannerProps {
  onStartClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onStartClick }) => {
  return (
    <section className="relative overflow-hidden py-12 lg:py-16 bg-[#FAF7F2] border-b border-[#E8DFC8]">
      
      {/* Background Subtle Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#8A1538]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
        
        {/* Top Highlight Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8A1538]/10 border border-[#8A1538]/20 text-[#8A1538] text-xs sm:text-sm font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-[#8A1538]" />
          <span className="font-bold">Rakshabandhan Gift 11 hurryup limited time</span>
        </div>

        {/* Main Title Calligraphy */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-laila tracking-tight text-[#8A1538] leading-tight">
            Personalized Raksha Bandhan Video
          </h1>
          <p className="text-xl sm:text-2xl font-extrabold text-[#8A1538]">
            Rakshabandhan Gift 11 hurryup limited time
          </p>
          <p className="text-lg sm:text-2xl font-bold text-[#44403C]">
            Add your photo & name to create your special Raksha Bandhan video.
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="pt-2">
          <button
            onClick={onStartClick}
            className="px-8 py-4 bg-[#8A1538] hover:bg-[#700B1A] text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition inline-flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Video className="w-6 h-6 text-amber-200 group-hover:rotate-12 transition-transform" />
            <span>Select Video Template – ₹11</span>
          </button>
        </div>

        {/* Key Feature Specs */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-[#57534E]">
          <div className="p-2.5 bg-white rounded-xl border border-[#E8DFC8]">
            📹 1080×1920 HD
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-[#E8DFC8]">
            🖼️ 1 Round Photo
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-[#E8DFC8]">
            ✍️ Personalized Name
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-[#E8DFC8]">
            🔒 Auto File Cleanup
          </div>
        </div>

      </div>
    </section>
  );
};
