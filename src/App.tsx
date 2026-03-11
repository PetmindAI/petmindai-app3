import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { CartProvider } from "./contexts/CartContext";
import { supabase } from "./supabaseClient";

import HomePage from "./pages/HomePage";
import AIAssistantPage from "./pages/AIAssistantPage";
import MarketplacePage from "./pages/MarketplacePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { RegisterVet } from "./RegisterVet";
import { PetDashboard } from "./PetDashboard";

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

return (
  <CartProvider>
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<HomePage />} />
        <Route path="/assistant" element={<AIAssistantPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
<Route path="/signup" element={<SignupPage />} />
        <Route
          path="/vet"
          element={!session ? <RegisterVet /> : <PetDashboard />}
        />

     </Routes>
    </BrowserRouter>
  </CartProvider>
);
  );
}

export default App;
