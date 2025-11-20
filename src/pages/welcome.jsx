import { useEffect } from "react";
import emailjs from "@emailjs/browser";

export default function Welcome() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");
    const phone = params.get("phone");

    if (email && name) {
      emailjs.send(
        "service_dsw51zc",
        "template_welcome_user",
        { to_email: email, name, phone },
        "hEtwuhRbrfCNNcjAo"
      );
    }
  }, []);

  return (
    <div className="text-center bg-black text-white pt-50 h-screen">
      <h2>Welcome Email Sent. You may close this tab.</h2>
    </div>
  );
}
