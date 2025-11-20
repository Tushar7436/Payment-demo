import { BrowserRouter, Routes, Route } from "react-router-dom";
import Razorpay from "./pages/RazorpayPay";
import Welcome from "./pages/welcome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/razorpay" element={<Razorpay />} />
        <Route path="/welcome" element={<Welcome />} />

        {/* fallback UI */}
        <Route
          path="*"
          element={
            <div className="text-center bg-black text-white pt-50 h-screen">
              <h2>Feel Free to close this tab</h2>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
