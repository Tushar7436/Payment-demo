import React, { useState } from 'react';
import { CreditCard, Lock, Check } from 'lucide-react';

export default function PaymentPage() {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    email: ''
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return;
    }
    
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }

    if (name === 'cvv' && value.length > 3) return;

    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-2xl">
            <CreditCard className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Secure Payment</h1>
          <p className="text-gray-400 font-light">Complete your purchase safely</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-800">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                <Check className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-400">Your transaction has been completed.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={processing}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  processing
                    ? 'bg-zinc-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Pay Now'
                )}
              </button>

              <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                <Lock className="w-4 h-4 mr-2" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 font-light">
          Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}