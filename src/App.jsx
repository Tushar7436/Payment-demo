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
            "template_li8f20h",
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
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {paymentStatus === "loading" && (
        <h2>Loading secure payment...</h2>
      )}

      {paymentStatus === "success" && (
        <div style={{ padding: "40px" }}>
          <h2 style={{ color: "#4a90e2", marginBottom: "20px" }}>
            ✅ Payment Successful!
          </h2>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "30px" }}>
            Thank you for your purchase. This tab is no longer needed. Please close this window.
          </p>
          <button
            onClick={handleWhatsappRedirect}
            style={{
              padding: "12px 30px",
              backgroundColor: "#25D366",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Chat on WhatsApp
          </button>
        </div>
      )}

      {paymentStatus === "failed" && (
        <div style={{ padding: "40px" }}>
          <h2 style={{ color: "#e74c3c" }}>❌ Payment Cancelled</h2>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Your payment was not completed. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
