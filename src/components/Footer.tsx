import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'terms' | 'refund' | 'privacy' | null>(null);

  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E8DFC8] text-[#1C1917] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Footer Banner: Auto-Delete Guarantee */}
        <div className="bg-white border border-[#E8DFC8] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-emerald-800">
                Data Privacy & Automatic File Deletion Guarantee
              </h4>
              <p className="text-xs text-[#57534E]">
                All uploaded photos and generated video files are automatically and permanently deleted from server memory immediately after download.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#8A1538] font-bold bg-[#8A1538]/10 px-4 py-2 rounded-xl border border-[#8A1538]/20 shrink-0">
            <span>🔒 100% Privacy Protected</span>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪔</span>
              <span className="text-xl font-bold font-laila text-[#8A1538]">
                Raksha Bandhan Studio
              </span>
            </div>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Create 1080×1920 HD vertical personalized Raksha Bandhan video greetings with your photo and name in seconds.
            </p>
          </div>

          {/* Quick Policy Links */}
          <div className="space-y-2">
            <h5 className="text-sm font-extrabold text-[#8A1538]">Policies</h5>
            <ul className="space-y-1.5 text-xs text-[#57534E]">
              <li>
                <button
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-[#8A1538] transition cursor-pointer"
                >
                  • Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('refund')}
                  className="hover:text-[#8A1538] transition cursor-pointer"
                >
                  • Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-[#8A1538] transition cursor-pointer"
                >
                  • Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h5 className="text-sm font-extrabold text-[#8A1538]">Features</h5>
            <ul className="space-y-1.5 text-xs text-[#57534E]">
              <li>• ₹11 Flat Pricing per video</li>
              <li>• 1080×1920 HD Vertical Format</li>
              <li>• 13 Ready-made Video Templates</li>
              <li>• Automatic Circular Masking & Centered Typography</li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-[#E8DFC8] text-center text-xs text-[#A8A29E]">
          <p>© {new Date().getFullYear()} Raksha Bandhan Personalized Video Greeting Generator. All rights reserved.</p>
        </div>

      </div>

      {/* Policy Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-lg w-full p-6 text-[#1C1917] relative shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#E8DFC8]/50 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {activeModal === 'terms' && (
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#8A1538]">Terms & Conditions</h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  1. Uploaded photos are used strictly for personalizing your video.<br />
                  2. ₹11 payment covers server video processing and HD output.<br />
                  3. Users must own or have permission to use the uploaded photo.<br />
                  4. यदि आपका Internet connection कमजोर है, Network या Server Slow होने के कारण Video Generate नहीं होता है, या आप Video Generate होने से पहले Back जाते हैं, तो इसके लिए हम जिम्मेदार नहीं होंगे।
                </p>
              </div>
            )}

            {activeModal === 'refund' && (
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#8A1538]">Refund Policy</h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  1. In the rare event of a technical issue preventing video rendering, 100% refund will be issued within 24 hours.<br />
                  2. Send your payment transaction ID to WhatsApp support for refund requests.
                </p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#8A1538]">Privacy Policy</h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  1. We do NOT store your photos or personal data on our servers.<br />
                  2. All temporary files are permanently purged immediately after video generation.<br />
                  3. We never sell, share, or monetize user data.<br />
                  4. यदि आपका Internet connection कमजोर है, Network या Server Slow होने के कारण Video Generate नहीं होता है, या आप Video Generate होने से पहले Back जाते हैं, तो इसके लिए हम जिम्मेदार नहीं होंगे।
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full py-2.5 bg-[#8A1538] hover:bg-[#700B1A] text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </footer>
  );
};
