import { useEffect } from "react";
import emailjs from "@emailjs/browser";

export default function App() {
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

          // 1) SEND EMAIL TO STUDENT -----------------------------------
          emailjs.send(
            "service_dsw51zc",
            "template_hi8z4g5",
              {
                  to_email: email,    // 👈 STUDENT EMAIL GOES HERE
                  phone,
                  order_id: orderId,
                  course,
                  course_id: courseId,
                  price,
                  payment_id: response.razorpay_payment_id
                },
            "hEtwuhRbrfCNNcjAo"
          );

          // 2) Notify backend -----------------------------------------
          await fetch("https://orena-node-bot.onrender.com/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: phone,
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              amount: amount,
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
                phone: phone,
                order_id: orderId,
                payment_id: "PAYMENT_FAILED",
                amount: amount,
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
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h2>Loading secure payment...</h2>
    </div>
  );
}
