import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsProcessing(false);
    setIsVerifying(false);
    setPaymentSuccess(false);
    setErrorMessage(null);

    loadRazorpayScript().catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitiatePayment = async () => {
    if (isProcessing || isVerifying) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();

      if (!loaded || !(window as any).Razorpay) {
        throw new Error(
          'Razorpay payment gateway could not be loaded. Please try again.'
        );
      }

      // 2. Create Razorpay order on backend
      const createOrderRes = await fetch(
        apiUrl('/api/create-order'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: 11,
            templateId
          })
        }
      );

      const orderData = await createOrderRes.json().catch(() => ({}));

      if (
        !createOrderRes.ok ||
        !orderData.success ||
        !orderData.order
      ) {
        throw new Error(
          orderData.error ||
            'Could not create Razorpay payment order.'
        );
      }

      const order = orderData.order;
      const keyId =
        orderData.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!keyId) {
        throw new Error(
          'Razorpay Key ID is missing on the server.'
        );
      }

      // 3. Razorpay Checkout
      const options = {
        key: keyId,

        amount: order.amount,

        currency: order.currency || 'INR',

        name: 'Raksha Bandhan Video Greetings',

        description: `₹11 Digital Gift - ${templateName}`,

        order_id: order.id,

        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setIsProcessing(false);
          setIsVerifying(true);
          setErrorMessage(null);

          try {
            // 4. Verify payment on backend
            const verifyRes = await fetch(
              apiUrl('/api/verify-payment'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  templateId,

                  amount: 11
                })
              }
            );

            const verifyData =
              await verifyRes.json().catch(() => ({}));

            if (
              !verifyRes.ok ||
              !verifyData.success ||
              !verifyData.paymentToken
            ) {
              throw new Error(
                verifyData.error ||
                  'Payment verification failed.'
              );
            }

            // 5. Payment successfully verified
            const verifiedPayment: PaymentInfo = {
              isPaid: true,

              paymentId:
                response.razorpay_payment_id,

              orderId:
                response.razorpay_order_id,

              upiRef:
                response.razorpay_payment_id,

              amount: 11,

              paidAt:
                new Date().toLocaleTimeString(),

              paymentToken:
                verifyData.paymentToken
            };

            try {
              localStorage.setItem(
                'rb_payment_info',
                JSON.stringify(verifiedPayment)
              );

              localStorage.setItem(
                'rb_payment_token',
                verifyData.paymentToken
              );
            } catch {}

            setIsVerifying(false);
            setPaymentSuccess(true);

            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 }
            });

            // Immediately unlock generator
            onPaymentSuccess(verifiedPayment);

            setTimeout(() => {
              onClose();
            }, 1000);

          } catch (error: any) {
            console.error(
              'Payment verification error:',
              error
            );

            setIsVerifying(false);

            setErrorMessage(
              error?.message ||
                'Payment verification failed. Please contact support if money was deducted.'
            );
          }
        },

        prefill: {
          name: '',
          email: '',
          contact: ''
        },

        notes: {
          templateId,
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

      const razorpay =
        new (window as any).Razorpay(options);

      razorpay.on(
        'payment.failed',
        (response: any) => {
          setIsProcessing(false);
          setIsVerifying(false);

          const reason =
            response?.error?.description ||
            response?.error?.reason ||
            'Payment was unsuccessful.';

          setErrorMessage(
            `Payment Failed: ${reason}`
          );
        }
      );

      razorpay.open();

    } catch (error: any) {
      console.error(
        'Razorpay payment initialization error:',
        error
      );

      setIsProcessing(false);
      setIsVerifying(false);

      setErrorMessage(
        error?.message ||
          'Could not connect to Razorpay.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">

      <div className="bg-[#FAF7F2] border border-[#C5A059] rounded-3xl max-w-lg w-full p-6 text-[#1C1917] relative shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          disabled={isProcessing || isVerifying}
          className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full disabled:opacity-30"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8A1538]/10 text-[#8A1538] border border-[#8A1538]/20 text-xs sm:text-sm font-bold">

            <Lock className="w-4 h-4" />

            <span>
              Secure Razorpay Payment
            </span>

          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[#8A1538]">
            Unlock Video Generator for ₹11
          </h3>

          <p className="text-sm text-[#78716C]">
            Selected Template:{' '}
            <span className="font-bold text-[#8A1538]">
              {templateName}
            </span>
          </p>

        </div>

        {paymentSuccess ? (

          <div className="text-center py-8 space-y-4">

            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-700">

              <CheckCircle2 className="w-12 h-12" />

            </div>

            <h4 className="text-2xl sm:text-3xl font-black text-emerald-800">
              Payment Verified!
            </h4>

            <p className="text-base text-[#57534E]">
              ₹11 payment successful.
              <br />
              Opening Video Generator...
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {/* Amount */}
            <div className="bg-gradient-to-r from-[#F5EFE6] via-white to-[#F5EFE6] p-4 rounded-2xl border border-[#E8DFC8] flex items-center justify-between">

              <div>
                <p className="text-sm font-bold">
                  Total Amount
                </p>

                <p className="text-xs sm:text-sm text-[#78716C]">
                  HD Personalized Video
                </p>
              </div>

              <div className="text-right">

                <span className="text-3xl sm:text-4xl font-black text-[#8A1538]">
                  ₹11
                </span>

                <span className="text-xs sm:text-sm text-[#8A1538] block font-bold">
                  Only
                </span>

              </div>

            </div>

            {/* Error */}
            {errorMessage && (

              <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-start gap-3 text-sm text-rose-800">

                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />

                <div>
                  <p className="font-bold">
                    Payment Error
                  </p>

                  <p className="text-rose-700">
                    {errorMessage}
                  </p>
                </div>

              </div>

            )}

            {/* Payment Methods */}
            <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5">

              <p className="text-sm font-bold text-[#57534E] mb-4">
                Pay securely using:
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm font-semibold">

                <div className="p-3 rounded-xl bg-[#F5EFE6] text-center">
                  📱 UPI
                </div>

                <div className="p-3 rounded-xl bg-[#F5EFE6] text-center">
                  💳 Cards
                </div>

                <div className="p-3 rounded-xl bg-[#F5EFE6] text-center">
                  🟣 PhonePe
                </div>

                <div className="p-3 rounded-xl bg-[#F5EFE6] text-center">
                  🌐 GPay
                </div>

              </div>

            </div>

            {/* Pay Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={isProcessing || isVerifying}
              className="w-full py-4 bg-[#8A1538] hover:bg-[#700B1A] text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >

              {isProcessing ? (

                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  <span>
                    Connecting to Razorpay...
                  </span>
                </>

              ) : isVerifying ? (

                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  <span>
                    Verifying Payment...
                  </span>
                </>

              ) : (

                <>
                  <span>
                    Pay ₹11 Securely
                  </span>

                  <ArrowRight className="w-5 h-5" />
                </>

              )}

            </button>

            {/* Security */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#78716C] text-center pt-2 border-t border-[#E8DFC8]">

              <ShieldCheck className="w-4 h-4 text-emerald-600" />

              <span>
                Secure Payment • Razorpay • Encrypted
              </span>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};