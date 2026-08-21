import React, { useState, useEffect } from 'react';
import { GreetingFormData, VideoTemplate, PaymentInfo } from '../types';
import { Download, CheckCircle2, ShieldCheck, X, FileVideo, AlertCircle, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiUrl } from '../utils/api';

interface VideoExporterProps {
  isOpen: boolean;
  onClose: () => void;
  formData: GreetingFormData;
  template: VideoTemplate;
  paymentInfo: PaymentInfo | null;
}

export const VideoExporter: React.FC<VideoExporterProps> = ({
  isOpen,
  onClose,
  formData,
  template,
  paymentInfo
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [videoPlayUrl, setVideoPlayUrl] = useState<string | null>(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('RakshaBandhan_Video.mp4');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsGenerating(false);
      setIsDone(false);
      setVideoPlayUrl(null);
      setServerDownloadUrl(null);
      setErrorMsg(null);
      return;
    }

    // Trigger video generation pipeline
    generateVideoOnServer();
  }, [isOpen]);

  const triggerDirectDownload = async (url: string, filename: string) => {
    try {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
          } catch {}
        }, 300);
        return;
      }

      // Fetch the binary file directly to ensure clean, untruncated MP4 download
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }, 5000);
    } catch (e) {
      console.warn('Direct blob download fallback:', e);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 300);
    }
  };

  const generateVideoOnServer = async () => {
    setIsGenerating(true);
    setProgress(15);
    setErrorMsg(null);

    // Simulated progress timer while server processes FFmpeg MP4
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 6 : prev));
    }, 350);

    try {
      // Auto-heal payment token if user has verified payment state
      let token = paymentInfo?.paymentToken || '';
      if (!token && paymentInfo?.isPaid) {
        try {
          const authRes = await fetch(apiUrl('/api/confirm-upi-payment'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId: template.id,
              upiRef: paymentInfo.paymentId || paymentInfo.upiRef || 'pay_session'
            })
          });
          const authData = await authRes.json().catch(() => ({}));
          if (authData.paymentToken) {
            token = authData.paymentToken;
          }
        } catch {}
      }

      const res = await fetch(apiUrl('/api/generate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          name: formData.name,
          photoBase64: formData.photo,
          paymentToken: token
        })
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Video generation failed' }));
        throw new Error(errorData.error || 'Server error generating video');
      }

      const contentType = res.headers.get('content-type') || '';
      let playUrl = '';
      let downloadUrl = '';
      let finalName = `RakshaBandhan_${formData.name ? formData.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Video'}.mp4`;

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Video generation was not successful');
        }
        playUrl = apiUrl(data.videoUrl || data.downloadUrl);
        downloadUrl = apiUrl(data.downloadUrl);
        if (data.filename) {
          finalName = data.filename;
        }
      } else {
        // Raw stream fallback
        const blob = await res.blob();
        playUrl = URL.createObjectURL(blob);
        downloadUrl = playUrl;
      }

      setVideoPlayUrl(playUrl);
      setServerDownloadUrl(downloadUrl);
      setDownloadFilename(finalName);
      setProgress(100);
      setIsGenerating(false);
      setIsDone(true);

      // Trigger auto download safely
      triggerDirectDownload(downloadUrl, finalName);

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Video generation error:', err);
      setErrorMsg(err.message || 'Failed to generate video. Please try again.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const handleDownloadFile = () => {
    const targetUrl = serverDownloadUrl || videoPlayUrl;
    if (!targetUrl) return;
    triggerDirectDownload(targetUrl, downloadFilename);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-md w-full p-6 text-center text-[#1C1917] relative shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#E8DFC8]/50 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-4 my-2">
          
          {errorMsg ? (
            <div className="space-y-3 py-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-red-700">Generation Error</h3>
              <p className="text-xs text-stone-600">{errorMsg}</p>
              <button
                onClick={generateVideoOnServer}
                className="px-6 py-2.5 bg-[#8A1538] text-white font-bold rounded-xl text-xs"
              >
                Retry Generation
              </button>
            </div>
          ) : !isDone ? (
            <>
              <div className="w-16 h-16 bg-[#8A1538]/10 border-2 border-[#8A1538] rounded-full flex items-center justify-center mx-auto text-[#8A1538] animate-spin">
                <FileVideo className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black font-rozha text-[#8A1538]">
                Generating Your HD MP4 Video...
              </h3>

              <p className="text-xs text-[#78716C]">
                Rendering 1080×1920 vertical video with circular photo and name overlay.
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-[#E8DFC8] rounded-full h-4 p-0.5 border border-[#C5A059]/40 overflow-hidden">
                <div
                  className="bg-[#8A1538] h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="text-sm font-extrabold text-[#8A1538]">
                {progress}% Complete
              </span>

              {/* Progress Warning Message */}
              <p className="text-xs sm:text-sm font-semibold text-[#8A1538] bg-[#8A1538]/10 border border-[#8A1538]/20 rounded-2xl p-3 leading-relaxed">
                कृपया Back न जाएँ और Internet connection मजबूत रखें। Video तैयार होने तक इस पेज को खुला रखें।
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black font-rozha text-emerald-800">
                Your HD Video is Ready!
              </h3>

              {/* Generated Video Preview Player */}
              {videoPlayUrl && (
                <div className="my-3 space-y-2">
                  <video
                    src={videoPlayUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full max-h-[360px] rounded-2xl border-2 border-[#C5A059] bg-black object-contain shadow-lg mx-auto"
                  />
                  <p className="text-sm font-medium text-[#57534E]">
                    Preview your personalized video above.
                  </p>
                </div>
              )}

              {/* Download Button Directly Below The Video */}
              <button
                onClick={handleDownloadFile}
                className="w-full py-4 bg-[#8A1538] hover:bg-[#700B1A] text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-[#8A1538]/20 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Download className="w-6 h-6 text-white" />
                <span>Download HD MP4 Video</span>
              </button>

              {/* Data Privacy & Auto Delete Notice */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-600/30 text-sm text-emerald-900 text-left space-y-1.5 mt-3 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold">Privacy & Security Guarantee:</span>
                </div>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  Your uploaded photo and temporary working files have been 100% automatically deleted from server memory. 🔒
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
