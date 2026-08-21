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
  const [currentView, setCurrentView] = useState<'catalog' | 'details'>('catalog');
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col justify-between selection:bg-[#8A1538] selection:text-white">
      
      {/* Navbar Header */}
      <Navbar
        onSelectTemplateClick={() => {
          if (!paymentInfo.isPaid) {
            setIsPaymentModalOpen(true);
          } else {
            handleBackToCatalog();
          }
        }}
        isPaid={paymentInfo.isPaid}
      />

      {/* Main Content Areas */}
      <main className="flex-grow">
        
        {/* Step 1: When not paid, show the NEW LANDING / HOME PAGE */}
        {!paymentInfo.isPaid ? (
          <LandingPage onUnlockClick={() => setIsPaymentModalOpen(true)} />
        ) : (
          /* Step 2: When paid, show either Template Page or Form Details */
          currentView === 'catalog' ? (
            <>
              {/* Unlocked Header Banner at the very top of Template Page */}
              <section className="bg-gradient-to-b from-[#8A1538]/10 via-[#FAF7F2] to-[#FAF7F2] border-b border-[#E8DFC8] py-10 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified • ₹11 Unlocked</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-5xl font-black font-laila text-[#8A1538] tracking-tight">
                    🎉 Your Digital Gift is Unlocked!
                  </h2>
                  
                  <p className="text-lg sm:text-2xl font-bold text-[#44403C] font-devanagari">
                    अब अपना Photo और Name add करके Personalized Rakhi Video बनाएं ❤️
                  </p>
                </div>
              </section>

              {/* Existing Template Selector Catalog (13 HD Video Templates) */}
              <TemplateSelector
                selectedTemplateId={selectedTemplate.id}
                onSelectTemplate={handleSelectTemplate}
              />
            </>
          ) : (
            /* Dedicated Personalization Page with existing Form and Generate Button */
            <VideoGenerator
              template={selectedTemplate}
              isPaid={paymentInfo.isPaid}
              onRequestPayment={() => setIsPaymentModalOpen(true)}
              onGenerateAndDownload={handleGenerateAndDownload}
              onBackToCatalog={handleBackToCatalog}
            />
          )
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
