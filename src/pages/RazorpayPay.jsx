import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

export default function Razorpay() {
  const [loading, setLoading] = useState(true);

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

    // Instead of exposing all data, backend will send a token
    const token = params.get("t");

    if (!token) {
      window.close();
      return;
    }

    // Decode token
    let data;
    try {
      data = JSON.parse(atob(token)); // BASE64 decode
    } catch (e) {
      window.close();
      return;
    }

    const { orderId, amount, key, phone, course, courseId, price, email } = data;

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

        // SUCCESS HANDLER
        handler: async function (response) {
          // Send confirmation email
          await sendEmail("template_li8f20h", {
            to_email: email,
            phone,
            order_id: orderId,
            course,
            course_id: courseId,
            price,
            payment_id: response.razorpay_payment_id
          });

          // Notify backend
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

          // Auto-close tab after 2 sec
          setTimeout(() => window.close(), 2000);
        },

        modal: {
          ondismiss: async function () {
            // Notify payment failure
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

            // Close tab
            setTimeout(() => window.close(), 1000);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="text-center bg-black text-white flex items-center justify-center h-screen">
      <h2 className="text-xl">Redirecting to Payment...</h2>
    </div>
  );
}
