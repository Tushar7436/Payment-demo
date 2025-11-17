import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // URL params sent from WhatsApp Node backend
    const params = new URLSearchParams(window.location.search);

    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const key = params.get("key");
    const phone = params.get("phone");
    const courseId = params.get("course");   // numeric id or slug
    const courseName = params.get("course_name") || courseId;

    // Validate essential params
    if (!orderId || !amount || !key) {
      alert("Invalid Payment Link");
      return;
    }

    // Dynamically load Razorpay library
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      const options = {
        key,
        amount,
        currency: "INR",
        name: "Orenna Courses",
        description: `Payment for ${courseName}`,
        order_id: orderId,
        prefill: { contact: phone },

        theme: { color: "#4a90e2" },

        handler: async function (response) {
          alert("Payment Successful!");

          // Send payment confirmation to backend
          await fetch("https://orena-node-bot.onrender.com/api/payment/success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              phone: phone,
              course_id: courseId,
              course_name: courseName,
              amount: amount
            })
          });
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
