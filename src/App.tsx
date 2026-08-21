/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TemplateSelector } from './components/TemplateSelector';
import { VideoGenerator } from './components/VideoGenerator';
import { PaymentModal } from './components/PaymentModal';
import { VideoExporter } from './components/VideoExporter';
import { Footer } from './components/Footer';

import { TEMPLATES, DEFAULT_SAMPLE_PHOTO } from './data/templates';
import { VideoTemplate, PaymentInfo, GreetingFormData } from './types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'details'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate>(TEMPLATES[0]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(() => {
    try {
      const saved = localStorage.getItem('rb_payment_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isPaid) return parsed;
      }
    } catch {}
    return {
      isPaid: false,
      paymentId: '',
      upiRef: '',
      amount: 11,
      paidAt: null
    };
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  
  const [activeFormData, setActiveFormData] = useState<GreetingFormData>({
    templateId: TEMPLATES[0].id,
    photo: DEFAULT_SAMPLE_PHOTO,
    name: 'Brother / Sister Name'
  });

  const handleSelectTemplate = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setActiveFormData(prev => ({
      ...prev,
      templateId: template.id
    }));
    setCurrentView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSuccess = (info: PaymentInfo) => {
    setPaymentInfo(info);
    try {
      localStorage.setItem('rb_payment_info', JSON.stringify(info));
    } catch {}
    setIsPaymentModalOpen(false);
    // After payment, open the Video Generator catalog
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateAndDownload = (formData: GreetingFormData) => {
    setActiveFormData(formData);
    if (!paymentInfo.isPaid) {
      setIsPaymentModalOpen(true);
    } else {
      setIsExporterOpen(true);
    }
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGenerator = () => {
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col justify-between selection:bg-[#8A1538] selection:text-white">
      
      {/* Navbar Header */}
      <Navbar
        onGoHome={handleGoHome}
        onSelectTemplateClick={() => {
          if (!paymentInfo.isPaid) {
            setIsPaymentModalOpen(true);
          } else {
            handleOpenGenerator();
          }
        }}
        isPaid={paymentInfo.isPaid}
        currentView={currentView}
      />

      {/* Main Content Areas */}
      <main className="flex-grow">
        
        {/* Step 1: Default Home Page displayed first when clicking the link */}
        {currentView === 'home' && (
          <LandingPage
            onUnlockClick={() => setIsPaymentModalOpen(true)}
            onOpenGenerator={handleOpenGenerator}
            isPaid={paymentInfo.isPaid}
          />
        )}

        {/* Step 2: Video Generator Template Catalog */}
        {currentView === 'catalog' && (
          <>
            {/* Unlocked Header Banner at top of Template Page */}
            <section className="bg-gradient-to-b from-[#8A1538]/10 via-[#FAF7F2] to-[#FAF7F2] border-b border-[#E8DFC8] py-8 px-4 text-center">
              <div className="max-w-3xl mx-auto space-y-3">
                {paymentInfo.isPaid ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified • ₹11 Unlocked</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs sm:text-sm font-bold shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Select Template & Customize • Unlock at ₹11</span>
                  </div>
                )}
                
                <h2 className="text-3xl sm:text-5xl font-black font-laila text-[#8A1538] tracking-tight">
                  {paymentInfo.isPaid ? '🎉 Select Your Video Template' : 'Choose a Video Template'}
                </h2>
                
                <p className="text-base sm:text-xl font-bold text-[#44403C] font-devanagari">
                  अपना Photo और Name add करके Personalized Rakhi Video बनाएं ❤️
                </p>
              </div>
            </section>

            {/* Template Selector Catalog (13 HD Video Templates) */}
            <TemplateSelector
              selectedTemplateId={selectedTemplate.id}
              onSelectTemplate={handleSelectTemplate}
              onBackToHome={handleGoHome}
            />
          </>
        )}

        {/* Step 3: Dedicated Video Generator Customization Form & Realtime Preview */}
        {currentView === 'details' && (
          <VideoGenerator
            template={selectedTemplate}
            isPaid={paymentInfo.isPaid}
            onRequestPayment={() => setIsPaymentModalOpen(true)}
            onGenerateAndDownload={handleGenerateAndDownload}
            onBackToCatalog={handleBackToCatalog}
          />
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Payment Modal (₹11 UPI) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        templateName={selectedTemplate.name}
        templateId={selectedTemplate.id}
      />

      {/* HD MP4 Video Generation & Direct Downloader Modal */}
      <VideoExporter
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        formData={activeFormData}
        template={selectedTemplate}
        paymentInfo={paymentInfo}
      />

    </div>
  );
}
