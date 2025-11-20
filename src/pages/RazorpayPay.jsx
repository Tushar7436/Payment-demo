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

    if (!orderId || !amount || !key) {
      alert("Invalid Payment Link");
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
          alert("Payment Successful!");

          // ⭐ PAYMENT EMAIL
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
