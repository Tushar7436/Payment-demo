import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

const backend_url = import.meta.env.VITE_BACKEND_URL || "https://orena-node-bot.onrender.com/api/payment";

export default function Razorpay() {
  const [status, setStatus] = useState("processing");
  
  const sendEmail = (templateId, payload) => {
    return emailjs.send(
      "service_dsw51zc",
      templateId,
      payload,
      "hEtwuhRbrfCNNcjAo"
    );
  };

  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return { success: true, data: await response.json() };
        
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 2000));
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const key = params.get("key");
    const phone = params.get("phone");
    const course = params.get("course");
    const courseId = params.get("course_id");
    const price = params.get("price");
    const email = params.get("email");

    // Clear URL parameters immediately for security
    window.history.replaceState({}, document.title, window.location.pathname);

    if (!orderId || !amount || !key || !phone || !courseId) {
      alert("Invalid Payment Link");
      setTimeout(() => window.close(), 2000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key,
        amount,
        currency: "INR",
        name: "Orenna Courses",
        description: `Payment for ${course}`,
        order_id: orderId,
        prefill: { contact: phone },
        theme: { color: "#4a90e2" },
        handler: async function (response) {
          try {
            setStatus("success");
            
            const paymentData = {
              phone,
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              amount,
              course_id: courseId
            };
            
            const [emailResult, backendResult] = await Promise.all([
              sendEmail("template_li8f20h", {
                to_email: email,
                phone,
                order_id: orderId,
                course,
                course_id: courseId,
                price,
                payment_id: response.razorpay_payment_id
              })
                .then(() => ({ success: true }))
                .catch(() => ({ success: false })),
              
              fetchWithRetry(backend_url, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify(paymentData)
              })
                .then(result => result)
                .catch(() => ({ success: false }))
            ]);

            if (backendResult.success) {
              setStatus("completed");
              alert(
                `Payment Successful! ✅\n\n` +
                `📧 Check your email for course details\n` +
                `📱 You'll receive a WhatsApp confirmation shortly`
              );
            } else {
              setStatus("partial");
              alert(
                `Payment Successful! ✅\n\n` +
                `Your payment has been received.\n` +
                `If you don't receive confirmation within 5 minutes, please contact support.`
              );
            }

            setTimeout(() => window.close(), 3000);
            
          } catch (error) {
            setStatus("error");
            alert("Payment successful! Please contact support if you don't receive confirmation.");
            setTimeout(() => window.close(), 3000);
          }
        },
        modal: {
          ondismiss: async function () {
            setStatus("cancelled");
            
            try {
              await fetchWithRetry(backend_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  order_id: orderId,
                  payment_id: "PAYMENT_FAILED",
                  amount,
                  course_id: courseId
                })
              }, 2);
            } catch (error) {
              // Silent fail for cancellation
            }
            
            setTimeout(() => window.close(), 2000);
          }
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center max-w-md mx-auto px-4">
        {status === "processing" && (
          <>
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
            <h2 className="text-xl">Processing Payment</h2>
            <p className="text-gray-400 mt-2">Please wait...</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            </div>
            <h2 className="text-xl text-green-500">Payment Successful!</h2>
            <p className="text-gray-400 mt-2">Sending confirmation...</p>
          </>
        )}
        
        {status === "completed" && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="text-2xl text-green-500 mb-4">All Done!</h2>
            <p className="text-gray-300 mb-2">📧 Check your email</p>
            <p className="text-gray-300">📱 WhatsApp confirmation sent</p>
          </>
        )}
        
        {status === "partial" && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="text-xl text-green-500 mb-2">Payment Successful!</h2>
            <p className="text-gray-300 text-sm">Your payment has been received</p>
          </>
        )}
        
        {status === "cancelled" && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="text-xl text-red-500">Payment Cancelled</h2>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="text-xl text-yellow-500">Payment Received</h2>
            <p className="text-gray-300 text-sm mt-2">Contact support if needed</p>
          </>
        )}
      </div>
    </div>
  );
}