import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
const backend_url = process.env.REACT_APP_backend_url || ""

export default function Razorpay() {
  const [status, setStatus] = useState("processing");
  
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
            console.log("Payment successful, processing...");
            setStatus("success");
            
            // ⭐ WAIT for both email and backend API to complete
            const results = await Promise.allSettled([
              // Send email
              sendEmail("template_li8f20h", {
                to_email: email,
                phone,
                order_id: orderId,
                course,
                course_id: courseId,
                price,
                payment_id: response.razorpay_payment_id
              }).then(() => console.log("✅ Email sent successfully"))
                .catch(err => {
                  console.error("❌ Email error:", err);
                  throw err;
                }),
              
              // Notify backend (this will trigger WhatsApp Business message)
              fetch(backend_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  order_id: orderId,
                  payment_id: response.razorpay_payment_id,
                  amount,
                  course_id: courseId
                })
              })
                .then(async res => {
                  if (!res.ok) {
                    throw new Error(`Backend returned ${res.status}`);
                  }
                  const data = await res.json();
                  console.log("✅ Backend response:", data);
                  return data;
                })
                .catch(err => {
                  console.error("❌ Backend error:", err);
                  throw err;
                })
            ]);

            // Check if backend call succeeded
            const backendResult = results[1];
            const emailResult = results[0];

            console.log("Email result:", emailResult.status);
            console.log("Backend result:", backendResult.status);

            if (backendResult.status === 'fulfilled') {
              console.log("✅ All operations completed successfully");
              console.log("📱 WhatsApp message should be sent by backend");
            } else {
              console.error("⚠️ Backend call failed:", backendResult.reason);
            }

            // 🎯 Show success message and let backend handle WhatsApp
            setStatus("completed");
            
            // Close window after showing success (or redirect to success page)
            setTimeout(() => {
              // Option 1: Close the window
              window.close();
              
              // Option 2: Redirect to success/home page if close doesn't work
              // window.location.href = "/success?order_id=" + orderId;
            }, 3000);
            
          } catch (error) {
            console.error("Error in payment handler:", error);
            setStatus("error");
            alert("Payment successful but there was an issue. Please contact support with Order ID: " + orderId);
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              console.log("Payment dismissed, notifying backend...");
              setStatus("cancelled");
              
              // Wait for backend call to complete
              await fetch(backend_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  order_id: orderId,
                  payment_id: "PAYMENT_FAILED",
                  amount,
                  course_id: courseId
                })
              });
              
              console.log("Backend notified of cancellation");
            } catch (error) {
              console.error("Error notifying backend:", error);
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
      <div className="text-center">
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
      </div>
    </div>
  );
}