import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Read URL params
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const key = params.get("key");
    const phone = params.get("phone");
    const course = params.get("course"); // not used now

    if (!orderId || !amount || !key) {
      alert("Invalid Payment Link");
      return;
    }

    // Load Razorpay checkout script dynamically
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

          // Send POST to Node backend
          await fetch("https://orena-node-bot.onrender.com/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: phone,
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              amount: amount
            })
          });
        },

        modal: {
          ondismiss: async function () {
            // If user closes the popup without paying
            await fetch("https://orena-node-bot.onrender.com/api/payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: phone,
                order_id: orderId,
                payment_id: "PAYMENT_FAILED",
                amount: amount
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
