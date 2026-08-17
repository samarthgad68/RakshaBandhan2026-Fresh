import React, { useRef, useState } from 'react';
import { TEMPLATES } from '../data/templates';
import { VideoTemplate, TemplateThemeId } from '../types';
import { Sparkles, CheckCircle, ArrowRight, Video, Volume2, VolumeX } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (template: VideoTemplate) => void;
  selectedTemplateId: TemplateThemeId;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const [unmutedVideoId, setUnmutedVideoId] = useState<string | null>(null);

  const toggleSound = (e: React.MouseEvent, tplId: string) => {
    e.stopPropagation();
    setUnmutedVideoId(prev => prev === tplId ? null : tplId);
  };

  return (
    <section id="templates-section" className="py-12 bg-[#FAF7F2] border-b border-[#E8DFC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Minimal, High-Impact All-India Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8A1538]/10 border border-[#8A1538]/20 text-[#8A1538] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>13 HD Video Templates • Only ₹11</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-bold font-laila text-[#8A1538] tracking-tight">
            Personalized Raksha Bandhan Video
          </h2>
          
          <p className="text-[#57534E] text-base sm:text-lg font-medium">
            Add your photo & name to create your special Raksha Bandhan video.
          </p>
        </div>

        {/* 13 Templates Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            const isUnmuted = unmutedVideoId === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col ${
                  isSelected
                    ? 'border-[#8A1538] shadow-2xl ring-2 ring-[#8A1538] scale-[1.02]'
                    : 'border-[#E8DFC8] hover:border-[#8A1538]/50 hover:shadow-xl'
                }`}
              >
                
                {/* Badge Tag */}
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8A1538] text-white shadow-md">
                    {tpl.badge}
                  </span>
                </div>

                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-20 bg-[#8A1538] text-white p-1.5 rounded-full shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}

                {/* Audio Toggle Button */}
                <button
                  onClick={(e) => toggleSound(e, tpl.id)}
                  className="absolute bottom-16 right-3 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition"
                  title={isUnmuted ? "Mute" : "Unmute preview"}
                >
                  {isUnmuted ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-300" />
                  )}
                </button>

                {/* Video Preview Container (9:16 Aspect Ratio) */}
                <div className="relative aspect-[9/16] w-full bg-stone-900 overflow-hidden">
                  <video
                    src={tpl.videoPath}
                    autoPlay
                    loop
                    muted={!isUnmuted}
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Quality Spec Tag */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] text-amber-200 font-bold tracking-wider">
                    1080×1920 HD
                  </div>
                </div>

                {/* Card Title & CTA */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <h3 className="text-base font-bold text-[#1C1917] truncate">
                      {tpl.name}
                    </h3>
                  </div>

                  {/* Direct Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(tpl);
                    }}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isSelected
                        ? 'bg-[#8A1538] text-white hover:bg-[#700B1A]'
                        : 'bg-[#FAF7F2] text-[#8A1538] border border-[#8A1538]/40 hover:bg-[#8A1538] hover:text-white'
                    }`}
                  >
                    <span>Create This Video – ₹11</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
