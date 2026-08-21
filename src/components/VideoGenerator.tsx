import React, { useState, useEffect, useRef } from 'react';
import { GreetingFormData, VideoTemplate } from '../types';
import { VideoCanvas } from './VideoCanvas';
import { DEFAULT_SAMPLE_PHOTO } from '../data/templates';
import { Upload, Download, Lock, ShieldCheck, Sparkles, User, Image as ImageIcon } from 'lucide-react';

interface VideoGeneratorProps {
  template: VideoTemplate;
  isPaid: boolean;
  onRequestPayment: () => void;
  onGenerateAndDownload: (formData: GreetingFormData) => void;
  onBackToCatalog: () => void;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  template,
  isPaid,
  onRequestPayment,
  onGenerateAndDownload,
  onBackToCatalog
}) => {
  // Simple form state: ONLY Photo + Name
  const [formData, setFormData] = useState<GreetingFormData>({
    templateId: template.id,
    photo: DEFAULT_SAMPLE_PHOTO,
    name: 'Brother / Sister Name'
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      templateId: template.id
    }));
  }, [template]);

  // Handle single photo upload with automatic high-quality optimization
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support large camera photos by resizing on client canvas to crisp 1080x1080
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1080;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.92);
          setFormData(prev => ({ ...prev, photo: optimizedBase64 }));
        } else {
          setFormData(prev => ({ ...prev, photo: src }));
        }
      };
      img.onerror = () => {
        setFormData(prev => ({ ...prev, photo: src }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="generator-studio" className="py-8 bg-[#FAF7F2] min-h-[80vh]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Back Navigation & Selected Template Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs font-bold text-[#8A1538] hover:bg-[#F5EFE6] transition shadow-sm cursor-pointer"
          >
            ← Back to Video Templates
          </button>

          <span className="px-3 py-1.5 rounded-full text-xs font-black bg-[#8A1538] text-white shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Selected: {template.name}
          </span>
        </div>

        {/* Dedicated Personalization Form Card (No Video Preview) */}
        <div className="bg-white border-2 border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          <div className="text-center space-y-2 pb-4 border-b border-[#E8DFC8]">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-laila text-[#8A1538]">
              Personalize Your Greeting Video
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              Upload a photo and enter your name to create your HD MP4 video.
            </p>
          </div>

          {/* Input 1: Photo Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-extrabold text-[#1C1917]">
              1. Upload Photo
            </label>

            <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC8]">
              {/* Photo Circle Thumbnail */}
              <div className="w-20 h-20 rounded-full border-2 border-[#8A1538] overflow-hidden shrink-0 bg-stone-200 shadow-sm flex items-center justify-center">
                {formData.photo ? (
                  <img src={formData.photo} alt="Uploaded Photo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-stone-400" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <p className="text-xs text-[#78716C] font-medium">
                  Select a photo (JPG, PNG, WebP) to crop into the video frame.
                </p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8A1538] hover:bg-[#700B1A] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md transition hover:scale-105 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Input 2: Your Name */}
          <div className="space-y-2">
            <label className="block text-sm font-extrabold text-[#1C1917]">
              2. Your Name
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name (e.g. Rohan / Ananya / प्रिय भाऊ)"
                maxLength={30}
                className="w-full pl-11 pr-4 py-3.5 bg-[#FAF7F2] border border-[#C5A059]/50 rounded-2xl text-[#1C1917] font-bold text-base focus:border-[#8A1538] focus:outline-none focus:ring-2 focus:ring-[#8A1538]/20 transition font-devanagari"
              />
            </div>
            <p className="text-[11px] text-[#78716C]">
              Supports English, Devanagari, Hindi, Marathi, Gujarati & Unicode scripts.
            </p>
          </div>

          {/* Generate / Download Action Button Immediately Below The Inputs */}
          <div className="pt-4 border-t border-[#E8DFC8] space-y-3">
            {isPaid ? (
              <button
                onClick={() => onGenerateAndDownload(formData)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-emerald-600/20 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-6 h-6 text-white" />
                <span>Download Video (HD MP4)</span>
              </button>
            ) : (
              <button
                onClick={() => onGenerateAndDownload(formData)}
                className="w-full py-4 bg-[#8A1538] hover:bg-[#700B1A] text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-[#8A1538]/20 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <span>Generate Video</span>
              </button>
            )}

            {!isPaid && (
              <p className="text-center text-xs font-bold text-[#8A1538]">
                🔒 Unlimited HD MP4 downloads available for only ₹11
              </p>
            )}
          </div>

          {/* Privacy Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>Your photo is encrypted and automatically deleted immediately after video generation.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
