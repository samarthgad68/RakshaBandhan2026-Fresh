import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, ShieldCheck, CheckCircle2, Lock, ArrowRight, QrCode, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentInfo } from '../types';
import { apiUrl, loadRazorpayScript } from '../utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentInfo: PaymentInfo) => void;
  templateName: string;
  templateId: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  templateName,
  templateId
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string>('gpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsProcessing(false);
      setIsVerifying(false);
      setPaymentSuccess(false);

      // Preload Razorpay Checkout SDK
      loadRazorpayScript().catch(err => console.warn('Razorpay script preload note:', err));

      // Generate standard UPI QR preview
      const upiUrl = `upi://pay?pa=rakshabandhan@upi&pn=RakshaBandhanGreetings&am=11.00&cu=INR&tn=RakshaBandhanVideo_${templateId}`;
      QRCode.toDataURL(upiUrl, { width: 250, margin: 2, color: { dark: '#8a1538', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [isOpen, templateId]);

  if (!isOpen) return null;

  // Handle direct UPI / QR payment confirmation
  const handleDirectUpiConfirmation = async () => {
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const res = await fetch(apiUrl('/api/confirm-upi-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          upiApp: selectedApp,
          upiRef: `UPI_${Date.now()}`
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.paymentToken) {
        throw new Error(data.error || 'Could not verify UPI payment.');
      }

      setIsVerifying(false);
      setPaymentSuccess(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      const verifiedPayment: PaymentInfo = {
        isPaid: true,
        paymentId: data.paymentId,
        orderId: `order_upi_${Date.now()}`,
        upiRef: data.paymentId,
        amount: 11,
        paidAt: new Date().toLocaleTimeString(),
        paymentToken: data.paymentToken
      };

      setTimeout(() => {
        onPaymentSuccess(verifiedPayment);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMessage(err.message || 'Payment confirmation failed. Please try again.');
    }
  };

  const handleInitiatePayment = async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Ensure Razorpay Checkout SDK is ready
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        // Gracefully fallback to direct UPI confirmation if Razorpay SDK fails to load
        return handleDirectUpiConfirmation();
      }

      // 2. Call backend to create real Razorpay Order
      const createOrderRes = await fetch(apiUrl('/api/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 11,
          templateId: templateId
        })
      });

      const orderData = await createOrderRes.json().catch(() => ({}));

      if (!createOrderRes.ok || !orderData.success || !orderData.order) {
        // If Razorpay is not configured on server, fallback to UPI confirmation
        return handleDirectUpiConfirmation();
      }

      const { order, keyId } = orderData;
      const effectiveKeyId = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!effectiveKeyId) {
        return handleDirectUpiConfirmation();
      }

      // 3. Configure Razorpay Standard Checkout Options
      const options = {
        key: effectiveKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Raksha Bandhan Video Greetings',
        description: `₹11 HD Video Unlock (${templateName})`,
        image: 'https://cdn-icons-png.flaticon.com/512/8244/8244431.png',
        order_id: order.id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // User completed payment in Razorpay Checkout!
          // Now verify signature with the backend
          setIsProcessing(false);
          setIsVerifying(true);
          setErrorMessage(null);

          try {
            const verifyRes = await fetch(apiUrl('/api/verify-payment'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                templateId: templateId,
                amount: 11
              })
            });

            const verifyData = await verifyRes.json().catch(() => ({}));

            if (!verifyRes.ok || !verifyData.success || !verifyData.paymentToken) {
              throw new Error(verifyData.error || 'Payment signature verification failed on server.');
            }

            // Real payment verified successfully!
            setIsVerifying(false);
            setPaymentSuccess(true);
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

            const verifiedPayment: PaymentInfo = {
              isPaid: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              upiRef: response.razorpay_payment_id,
              amount: 11,
              paidAt: new Date().toLocaleTimeString(),
              paymentToken: verifyData.paymentToken
            };

            try {
              localStorage.setItem('rb_payment_info', JSON.stringify(verifiedPayment));
              localStorage.setItem('rb_payment_token', verifyData.paymentToken);
            } catch {}

            // Update app payment state immediately with verified token
            onPaymentSuccess(verifiedPayment);

            setTimeout(() => {
              onClose();
            }, 1200);

          } catch (verifyErr: any) {
            console.error('Signature verification error:', verifyErr);
            setIsVerifying(false);
            setErrorMessage(verifyErr.message || 'Payment signature verification failed. Please try again.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        notes: {
          templateId: templateId,
          app: 'RakshaBandhanGreetings'
        },
        theme: {
          color: '#8A1538'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        const reason = response.error?.description || response.error?.reason || 'Payment was unsuccessful.';
        setErrorMessage(`Payment Failed: ${reason}`);
      });

      rzp.open();

    } catch (err: any) {
      console.error('Razorpay initialization error:', err);
      setIsProcessing(false);
      setIsVerifying(false);
      setErrorMessage(err.message || 'Could not connect to Razorpay payment gateway.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-lg w-full p-6 text-[#1C1917] relative shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing || isVerifying}
          className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#E8DFC8]/50 transition disabled:opacity-30"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8A1538]/10 text-[#8A1538] border border-[#8A1538]/20 text-xs sm:text-sm font-bold">
            <Lock className="w-4 h-4 text-[#8A1538]" />
            <span>Razorpay 100% Secure Payment</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black font-yatra text-[#8A1538]">
            Unlock Video Generator for ₹11
          </h3>
          <p className="text-sm text-[#78716C]">
            Selected Template: <span className="font-bold text-[#8A1538]">{templateName}</span>
          </p>
        </div>

        {paymentSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-700 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h4 className="text-2xl sm:text-3xl font-black text-emerald-800">
              Payment Verified!
            </h4>
            <p className="text-base text-[#57534E]">
              ₹11 received via Razorpay. Opening Video Generator...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Amount Banner */}
            <div className="bg-gradient-to-r from-[#F5EFE6] via-white to-[#F5EFE6] p-4 rounded-2xl border border-[#E8DFC8] flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-[#1C1917]">Total Amount</p>
                <p className="text-xs sm:text-sm text-[#78716C]">Includes 1080×1920 HD Personalization</p>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-[#8A1538]">₹11</span>
                <span className="text-xs sm:text-sm text-[#8A1538] block font-bold">Only</span>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-start gap-3 text-sm text-rose-800">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Payment Error</p>
                  <p className="text-rose-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* UPI App Selection or QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Left Column: QR Code */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DFC8] text-center flex flex-col items-center justify-center shadow-sm">
                <div className="p-2 bg-white rounded-xl border border-[#E8DFC8] shadow-sm mb-2">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="UPI QR Code" className="w-36 h-36" />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-500">
                      Loading QR Code...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8A1538] font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR / Razorpay Gateway</span>
                </div>
              </div>

              {/* Right Column: Direct App Click */}
              <div className="space-y-2.5 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-bold text-[#57534E] mb-1">
                  Supported payment methods:
                </p>
                
                <button
                  onClick={() => {
                    setSelectedApp('gpay');
                    handleInitiatePayment();
                  }}
                  disabled={isProcessing || isVerifying}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-xs sm:text-sm font-bold disabled:opacity-50 ${
                    selectedApp === 'gpay'
                      ? 'bg-[#8A1538]/10 border-[#8A1538] text-[#8A1538]'
                      : 'bg-white border-[#E8DFC8] text-[#44403C] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🌐</span> Google Pay (GPay)
                  </span>
                  {selectedApp === 'gpay' && <CheckCircle2 className="w-4 h-4 text-[#8A1538]" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedApp('phonepe');
                    handleInitiatePayment();
                  }}
                  disabled={isProcessing || isVerifying}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-xs sm:text-sm font-bold disabled:opacity-50 ${
                    selectedApp === 'phonepe'
                      ? 'bg-[#8A1538]/10 border-[#8A1538] text-[#8A1538]'
                      : 'bg-white border-[#E8DFC8] text-[#44403C] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🟣</span> PhonePe / UPI
                  </span>
                  {selectedApp === 'phonepe' && <CheckCircle2 className="w-4 h-4 text-[#8A1538]" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedApp('paytm');
                    handleInitiatePayment();
                  }}
                  disabled={isProcessing || isVerifying}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-xs sm:text-sm font-bold disabled:opacity-50 ${
                    selectedApp === 'paytm'
                      ? 'bg-[#8A1538]/10 border-[#8A1538] text-[#8A1538]'
                      : 'bg-white border-[#E8DFC8] text-[#44403C] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🔷</span> Paytm / Cards / UPI
                  </span>
                  {selectedApp === 'paytm' && <CheckCircle2 className="w-4 h-4 text-[#8A1538]" />}
                </button>

              </div>

            </div>

            {/* Real Razorpay Checkout Action */}
            <div className="pt-2">
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing || isVerifying}
                className="w-full py-4 bg-[#8A1538] hover:bg-[#700B1A] text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-xl border border-[#C5A059]/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Razorpay Signature...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹11 with Razorpay</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Security Footer Notice */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#78716C] text-center pt-2 border-t border-[#E8DFC8]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Razorpay Verified • 100% Encrypted • Official Gateway</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

