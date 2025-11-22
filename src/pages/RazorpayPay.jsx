import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
const backend_url = process.env.REACT_APP_backend_url || ""

export default function Razorpay() {
  const [status, setStatus] = useState("processing");
  const [debugInfo, setDebugInfo] = useState("");
  
  // ----------------------------------------------------
  //  COMMON EMAIL SENDER (reusable)
  // ----------------------------------------------------
  const sendEmail = (templateId, payload) => {
    return emailjs.send(
      "service_dsw51zc",
      templateId,
      payload,
      "hEtwuhRbrfCNNcjAo"
    );
  };

  useEffect(() => {
    // Debug: Show backend URL
    console.log("🔗 Backend URL:", backend_url);
    setDebugInfo(`Backend: ${backend_url || 'NOT SET'}`);
    
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const key = params.get("key");
    const phone = params.get("phone");
    const course = params.get("course");
    const courseId = params.get("course_id");
    const price = params.get("price");
    const email = params.get("email");

    // Basic validation - if parameters are missing, it's invalid
    if (!orderId || !amount || !key || !phone || !courseId) {
      alert("Invalid Payment Link - Missing required parameters");
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
            console.log("✅ Payment successful:", response.razorpay_payment_id);
            setStatus("success");
            
            const paymentData = {
              phone,
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              amount,
              course_id: courseId
            };
            
            console.log("📤 Sending to backend:", paymentData);
            console.log("🔗 Backend URL:", backend_url);
            
            // Send email first (this usually works)
            const emailPromise = sendEmail("template_li8f20h", {
              to_email: email,
              phone,
              order_id: orderId,
              course,
              course_id: courseId,
              price,
              payment_id: response.razorpay_payment_id
            })
              .then(() => {
                console.log("✅ Email sent successfully");
                return { success: true, type: 'email' };
              })
              .catch(err => {
                console.error("❌ Email error:", err);
                return { success: false, type: 'email', error: err.message };
              });
            
            // Send to backend with detailed error logging
            const backendPromise = fetch(backend_url, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify(paymentData),
              // Add timeout handling
              signal: AbortSignal.timeout(15000) // 15 second timeout
            })
              .then(async res => {
                console.log("📥 Backend response status:", res.status);
                
                if (!res.ok) {
                  const errorText = await res.text();
                  console.error("❌ Backend error response:", errorText);
                  throw new Error(`Backend returned ${res.status}: ${errorText}`);
                }
                
                const data = await res.json();
                console.log("✅ Backend response data:", data);
                return { success: true, type: 'backend', data };
              })
              .catch(err => {
                console.error("❌ Backend fetch error:", err);
                console.error("Error type:", err.name);
                console.error("Error message:", err.message);
                
                // More specific error messages
                let errorMsg = err.message;
                if (err.name === 'AbortError') {
                  errorMsg = "Request timeout - backend took too long to respond";
                } else if (err.message.includes('Failed to fetch')) {
                  errorMsg = "Network error - cannot reach backend (CORS or URL issue)";
                }
                
                return { success: false, type: 'backend', error: errorMsg };
              });

            // Wait for both
            const [emailResult, backendResult] = await Promise.all([emailPromise, backendPromise]);

            console.log("📊 Results:", { emailResult, backendResult });

            if (backendResult.success) {
              console.log("✅ All operations completed successfully");
              setStatus("completed");
              setDebugInfo("✅ Backend notified successfully");
            } else {
              console.error("⚠️ Backend call failed:", backendResult.error);
              setStatus("partial");
              setDebugInfo(`⚠️ Backend error: ${backendResult.error}`);
              
              // Still show success to user but log the issue
              alert(
                `Payment successful! ✅\n\n` +
                `Order ID: ${orderId}\n` +
                `Payment ID: ${response.razorpay_payment_id}\n\n` +
                `Note: There was a connection issue. Please contact support with your Order ID if you don't receive confirmation.`
              );
            }

            // Close window after delay
            setTimeout(() => {
              window.close();
            }, 5000);
            
          } catch (error) {
            console.error("💥 Unexpected error in payment handler:", error);
            setStatus("error");
            setDebugInfo(`Error: ${error.message}`);
            alert("Payment successful but there was an issue. Please contact support with Order ID: " + orderId);
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              console.log("❌ Payment dismissed/cancelled");
              setStatus("cancelled");
              
              // Try to notify backend of cancellation
              const cancelData = {
                phone,
                order_id: orderId,
                payment_id: "PAYMENT_FAILED",
                amount,
                course_id: courseId
              };
              
              console.log("📤 Notifying backend of cancellation:", cancelData);
              
              await fetch(backend_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cancelData),
                signal: AbortSignal.timeout(10000)
              })
                .then(res => {
                  console.log("✅ Backend notified of cancellation");
                  return res.json();
                })
                .catch(err => {
                  console.error("⚠️ Could not notify backend of cancellation:", err);
                });
              
            } catch (error) {
              console.error("Error in ondismiss:", error);
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
            <h2 className="text-xl">Processing your payment...</h2>
            <p className="text-gray-400 mt-2">Please wait, do not close this window</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            </div>
            <h2 className="text-xl text-green-500">Payment Successful! ✅</h2>
            <p className="text-gray-400 mt-2">Sending confirmation...</p>
          </>
        )}
        
        {status === "completed" && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="text-2xl text-green-500 mb-4">Payment Successful!</h2>
            <p className="text-gray-300 mb-2">📧 Check your email for course details</p>
            <p className="text-gray-300">📱 You'll receive a WhatsApp message shortly</p>
            <p className="text-gray-400 text-sm mt-4">This window will close automatically...</p>
          </>
        )}
        
        {status === "partial" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="text-xl text-yellow-500">Payment Successful!</h2>
            <p className="text-gray-300 mt-2">Your payment was processed successfully</p>
            <p className="text-gray-400 text-sm mt-4">If you don't receive confirmation, please contact support</p>
          </>
        )}
        
        {status === "cancelled" && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="text-xl text-red-500">Payment Cancelled</h2>
            <p className="text-gray-400 mt-2">This window will close shortly...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="text-xl text-yellow-500">Payment Processed</h2>
            <p className="text-gray-300 mt-2">Please contact support if you don't receive confirmation</p>
          </>
        )}
        
        {/* Debug info - remove in production */}
        {debugInfo && (
          <p className="text-xs text-gray-600 mt-4 break-all">{debugInfo}</p>
        )}
      </div>
    </div>
  );
}