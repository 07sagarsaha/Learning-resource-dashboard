import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function App() {
  const [dark, setdark] = useState(localStorage.getItem("dark") === "true");

  useEffect(() => {
    localStorage.setItem("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (dark) {
      if (!document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.add("dark");
      }
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <AuthProvider>
      <Router>
        {/* <button
          onClick={() => setdark(!dark)}
          className="fixed top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
        >
          {dark ? "Light Mode" : "Dark Mode"}
        </button> */}
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Auth />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
