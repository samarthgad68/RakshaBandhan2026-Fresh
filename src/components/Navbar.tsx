import React from 'react';
import { ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onSelectTemplateClick: () => void;
  isPaid: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectTemplateClick, isPaid }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DFC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#700B1A] via-[#8A1538] to-[#C5A059] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#FFFDF9] rounded-full flex items-center justify-center">
              <span className="text-xl">🪔</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-laila tracking-normal text-[#8A1538]">
                Raksha Bandhan
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-bold bg-[#8A1538]/10 text-[#8A1538] border border-[#8A1538]/20 rounded-full">
                Video Studio
              </span>
            </div>
            <p className="text-xs text-[#57534E] font-medium">
              1080×1920 HD Personalization • All India
            </p>
          </div>
        </div>

        {/* Action Button & Status */}
        <div className="flex items-center space-x-3">
          {isPaid ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Studio Unlocked (₹11 Paid)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#57534E] bg-[#F3ECE2] border border-[#E8DFC8] px-3.5 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#8A1538]" />
                <span>100% Encrypted & Auto-Deleted</span>
              </div>
              <button
                onClick={onSelectTemplateClick}
                className="bg-[#8A1538] hover:bg-[#700B1A] text-white font-black px-4.5 py-2 rounded-full text-sm shadow-md hover:scale-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Create For ₹11</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
