import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

export default function Razorpay() {
  const [razorpayOpened, setRazorpayOpened] = useState(false);

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
    const token = params.get("t");

    // If no token, close page
    if (!token) {
      window.close();
      return;
    }

    let data;
    try {
      data = JSON.parse(atob(token)); // Decode
    } catch (e) {
      window.close();
      return;
    }

    const { orderId, amount, key, phone, course, courseId, price, email } = data;

    // Load Razorpay JS
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      const options = {
        key,
        amount,
        currency: "INR",
        name: "Orena Courses",
        description: `Payment for ${course}`,
        order_id: orderId,
        prefill: { contact: phone },
        theme: { color: "#4a90e2" },

        handler: async function (response) {
          // SUCCESS BLOCK

          await sendEmail("template_li8f20h", {
            to_email: email,
            phone,
            order_id: orderId,
            course,
            course_id: courseId,
            price,
            payment_id: response.razorpay_payment_id
          });

          await fetch("https://orena-node-bot.onrender.com/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              amount,
              course_id: courseId
            })
          });

          // CLOSE TAB AFTER SUCCESS
          setTimeout(() => window.close(), 1000);
        },

        modal: {
          ondismiss: async function () {
            if (!razorpayOpened) return; // prevent premature close on load

            // FAILED PAYMENT
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

            // Close tab after user closes the modal
            setTimeout(() => window.close(), 1000);
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      // OPEN Razorpay UI SAFELY
      try {
        razorpay.open();
        setRazorpayOpened(true);
      } catch (err) {
        console.error("Razorpay failed:", err);
      }
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="text-center bg-black text-white flex items-center justify-center h-screen">
      <h2 className="text-xl animate-pulse">Redirecting to Payment...</h2>
    </div>
  );
}
