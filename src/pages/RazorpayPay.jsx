import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
const backend_url = import.meta.env.VITE_BACKEND_URL;

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

  // ----------------------------------------------------
  //  RETRY FETCH WITH EXPONENTIAL BACKOFF
  // ----------------------------------------------------
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1}/${maxRetries} to reach backend...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        console.log(`✅ Backend responded on attempt ${i + 1}:`, data);
        return { success: true, data };
        
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error.message);
        
        // If it's the last retry, throw the error
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff: 2s, 4s, 8s)
        const waitTime = Math.pow(2, i) * 2000;
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  useEffect(() => {
    // Debug: Show backend URL
    console.log("🔗 Backend URL:", backend_url);
    
    if (!backend_url) {
      console.error("❌ BACKEND_URL NOT SET!");
      setDebugInfo("ERROR: Backend URL not configured");
      alert("Configuration error: Backend URL is missing. Please contact support.");
      return;
    }
    
    setDebugInfo(`Backend: ${backend_url}`);
    
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const key = params.get("key");
    const phone = params.get("phone");
    const course = params.get("course");
    const courseId = params.get("course_id");
    const price = params.get("price");
    const email = params.get("email");

    // Basic validation
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
            
            console.log("📤 Payment data:", paymentData);
            
            // Send email (usually reliable)
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
                console.log("✅ Email sent");
                return { success: true };
              })
              .catch(err => {
                console.error("❌ Email failed:", err);
                return { success: false, error: err.message };
              });
            
            // Send to backend WITH RETRY
            setDebugInfo("Contacting backend (this may take a moment)...");
            
            const backendPromise = fetchWithRetry(
              backend_url,
              {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify(paymentData)
              },
              3 // 3 retry attempts
            )
              .then(result => {
                console.log("✅ Backend call successful");
                return result;
              })
              .catch(err => {
                console.error("❌ All backend retry attempts failed:", err);
                return { success: false, error: err.message };
              });

            // Wait for both
            const [emailResult, backendResult] = await Promise.all([
              emailPromise, 
              backendPromise
            ]);

            console.log("📊 Final results:", { emailResult, backendResult });

            if (backendResult.success) {
              console.log("✅ Everything completed successfully");
              setStatus("completed");
              setDebugInfo("✅ All confirmations sent");
              
              // Simple success message
              alert(
                `Payment Successful! ✅\n\n` +
                `Order ID: ${orderId}\n` +
                `Payment ID: ${response.razorpay_payment_id}\n\n` +
                `📧 Check your email\n` +
                `📱 WhatsApp message incoming!`
              );
            } else {
              console.error("⚠️ Backend unreachable:", backendResult.error);
              setStatus("partial");
              setDebugInfo(`Backend error: ${backendResult.error}`);
              
              // Show error to user
              alert(
                `Payment Successful! ✅\n\n` +
                `Order ID: ${orderId}\n` +
                `Payment ID: ${response.razorpay_payment_id}\n\n` +
                `Note: There was a connection issue. Please contact support with your Order ID if you don't receive confirmation.`
              );
            }

            // Close after 5 seconds
            setTimeout(() => {
              window.close();
            }, 5000);
            
          } catch (error) {
            console.error("💥 Unexpected error:", error);
            setStatus("error");
            alert("Payment successful! Please save your Order ID: " + orderId);
          }
        },
        modal: {
          ondismiss: async function () {
            console.log("❌ Payment cancelled");
            setStatus("cancelled");
            
            try {
              // Try to notify backend (with single retry)
              await fetchWithRetry(
                backend_url,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phone,
                    order_id: orderId,
                    payment_id: "PAYMENT_FAILED",
                    amount,
                    course_id: courseId
                  })
                },
                2 // 2 attempts for cancellation
              );
            } catch (error) {
              console.error("⚠️ Could not notify backend of cancellation");
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
            <p className="text-gray-400 mt-2">Please wait</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            </div>
            <h2 className="text-xl text-green-500">Payment Successful! ✅</h2>
            <p className="text-gray-400 mt-2">Sending confirmations...</p>
            {debugInfo && (
              <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
            )}
          </>
        )}
        
        {status === "completed" && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="text-2xl text-green-500 mb-4">All Done!</h2>
            <p className="text-gray-300 mb-2">📧 Check your email</p>
            <p className="text-gray-300">📱 WhatsApp message sent</p>
            <p className="text-gray-400 text-sm mt-4">Closing...</p>
          </>
        )}
        
        {status === "partial" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="text-xl text-yellow-500">Payment Successful</h2>
            <p className="text-gray-300 mt-2 mb-4">But we couldn't reach our server</p>
            {debugInfo && (
              <p className="text-xs text-gray-500 mb-4 break-all">{debugInfo}</p>
            )}
            <p className="text-gray-400 text-sm">Please contact support if needed</p>
          </>
        )}
        
        {status === "cancelled" && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="text-xl text-red-500">Payment Cancelled</h2>
            <p className="text-gray-400 mt-2">Closing...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="text-xl text-yellow-500">Payment Processed</h2>
            <p className="text-gray-300 mt-2">Save your Order ID</p>
          </>
        )}
      </div>
    </div>
  );
}