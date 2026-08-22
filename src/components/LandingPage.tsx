import React from 'react';
import { Gift, Sparkles, ShieldCheck, Film } from 'lucide-react';

interface LandingPageProps {
  onUnlockClick: () => void;
  onOpenGenerator: () => void;
  isPaid: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onUnlockClick,
  onOpenGenerator,
  isPaid,
}) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-10 min-h-[70vh]">
      
      {/* Decorative Glow & Top Badge */}
      <div className="relative w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#8A1538]/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8A1538]/10 border border-[#8A1538]/20 text-[#8A1538] text-sm sm:text-base font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-[#8A1538]" />
            <span>Special Festival Offer • Instant Delivery</span>
          </div>

          {/* Heading 1: RAKSHA BANDHAN DIGITAL GIFT ₹ 11/- */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-laila tracking-tight text-[#8A1538] uppercase leading-tight drop-shadow-sm">
            RAKSHA BANDHAN DIGITAL GIFT <span className="text-[#8A1538] underline decoration-[#C5A059] decoration-wavy decoration-2">₹ 11/-</span>
          </h1>

          {/* Subheading 2: 🎁 Unlock Your Digital Gift */}
          <div className="text-2xl sm:text-4xl font-extrabold text-[#1C1917] flex items-center justify-center gap-2">
            <span>🎁</span>
            <span className="bg-gradient-to-r from-[#8A1538] to-[#A81B45] bg-clip-text text-transparent">
              Unlock Your Digital Gift
            </span>
          </div>

          {/* Subheading 3: अपना फोटो और नाम के साथ अपना Digital Gift पाएं ❤️ */}
          <p className="text-lg sm:text-2xl font-bold text-[#44403C] leading-relaxed max-w-xl mx-auto font-devanagari">
            अपना फोटो और नाम के साथ अपना Digital Gift पाएं ❤️
          </p>

          {/* Prominent Action Button */}
          <div className="pt-4 max-w-md mx-auto w-full">
            {isPaid ? (
              <button
                onClick={onOpenGenerator}
                id="open-generator-btn"
                className="w-full py-5 px-8 bg-gradient-to-r from-[#8A1538] via-[#A81B45] to-[#8A1538] hover:from-[#700B1A] hover:to-[#700B1A] text-white text-xl sm:text-2xl font-black rounded-3xl shadow-2xl shadow-[#8A1538]/40 border-2 border-[#C5A059] hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group"
              >
                <Film className="w-7 h-7 text-amber-200 group-hover:rotate-12 transition-transform" />
                <span>
                  Create & Download Video
                </span>
              </button>
            ) : (
              <button
                onClick={onUnlockClick}
                id="unlock-gift-btn"
                className="w-full py-5 px-8 bg-gradient-to-r from-[#8A1538] via-[#A81B45] to-[#8A1538] hover:from-[#700B1A] hover:to-[#700B1A] text-white text-xl sm:text-2xl font-black rounded-3xl shadow-2xl shadow-[#8A1538]/40 border-2 border-[#C5A059] hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group"
              >
                <Gift className="w-7 h-7 text-amber-200 group-hover:rotate-12 transition-transform" />
                <span>
                  DOWNLOAD / UNLOCK – <span className="text-amber-300 font-extrabold tracking-wide">₹11/-</span>
                </span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Feature Highlights Minimal Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5 w-full max-w-md text-sm sm:text-base font-bold text-[#57534E] pt-2">
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8DFC8] shadow-sm flex items-center justify-center gap-2">
          <span>⚡</span>
          <span>Instant Download</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8DFC8] shadow-sm flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>100% Safe & Secure</span>
        </div>
      </div>

    </section>
  );
};
