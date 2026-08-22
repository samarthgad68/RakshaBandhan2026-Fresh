import React from 'react';
import { Home } from 'lucide-react';

interface NavbarProps {
  onGoHome: () => void;
  onSelectTemplateClick?: () => void;
  isPaid?: boolean;
  currentView: 'home' | 'catalog' | 'details';
}

export const Navbar: React.FC<NavbarProps> = ({
  onGoHome,
  currentView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Title - Clickable to go Home */}
        <div 
          onClick={onGoHome}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Go to Home"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#700B1A] via-[#8A1538] to-[#C5A059] p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition">
            <div className="w-full h-full bg-[#FFFDF9] rounded-full flex items-center justify-center">
              <span className="text-xl">🪔</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-laila tracking-normal text-[#8A1538] group-hover:text-[#700B1A] transition">
              Raksha Bandhan
            </h1>
          </div>
        </div>

        {/* Navigation Action */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentView !== 'home' && (
            <button
              onClick={onGoHome}
              className="px-3.5 py-2 rounded-full border border-[#E8DFC8] bg-white text-[#57534E] hover:text-[#8A1538] hover:border-[#8A1538]/40 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
