import { useEffect } from "react";
import emailjs from "@emailjs/browser";

export default function Razorpay() {
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
          // 🎯 INSTANT redirect to WhatsApp - do email/backend calls in background
          const whatsappNumber = "15556319362"; // e.g., "911234567890"
          const message = encodeURIComponent(
            `✅ Payment Successful!\n\nCourse: ${course}\nOrder ID: ${orderId}\nAmount: ₹${(amount / 100).toFixed(2)}\nPayment ID: ${response.razorpay_payment_id}`
          );
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
          
          // Redirect IMMEDIATELY
          window.location.href = whatsappUrl;
          
          // Send email & notify backend in background (non-blocking)
          Promise.all([
            sendEmail("template_li8f20h", {
              to_email: email,
              phone,
              order_id: orderId,
              course,
              course_id: courseId,
              price,
              payment_id: response.razorpay_payment_id
            }).catch(err => console.error("Email error:", err)),
            
            fetch("https://orena-node-bot.onrender.com/api/payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone,
                order_id: orderId,
                payment_id: response.razorpay_payment_id,
                amount,
                course_id: courseId
              })
            }).catch(err => console.error("Backend error:", err))
          ]);
          
          // Close tab after redirect
          setTimeout(() => window.close(), 500);
        },
        modal: {
          ondismiss: async function () {
            await fetch("https://orena-node-bot.onrender.com/api/payment", {
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
            
            // Close tab when payment is cancelled
            window.close();
          }
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="text-center bg-black text-white pt-50 h-screen">
      <h2>Redirecting to Payment...</h2>
    </div>
  );
}