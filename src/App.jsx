import React, { useState, useEffect, useCallback } from "react";
import { Wifi, Wallet, Plus, Smartphone, ChevronRight, X, LogOut, Signal } from "lucide-react";
import { api } from "./api";

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", bg: "#FFF9E0" },
  { id: "airtel", name: "Airtel", color: "#FF3B30", bg: "#FFEBEA" },
  { id: "glo", name: "Glo", color: "#00A651", bg: "#E6F7ED" },
  { id: "9mobile", name: "9mobile", color: "#00A99D", bg: "#E0F6F4" },
];

const fmt = (kobo) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    kobo / 100
  );

// --- Auth screen ---------------------------------------------------------

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralUsername, setReferralUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const registerValid =
    fullName && username && email && phone && password.length >= 8 && password === confirmPassword && agreed;

  const submit = async () => {
    setError("");
    if (mode === "register") {
      if (password !== confirmPassword) return setError("Passwords do not match");
      if (!agreed) return setError("You must agree to the Terms and Privacy Policy");
    }
    setBusy(true);
    try {
      let data;
      if (mode === "login") {
        data = await api.login(email, password);
      } else {
        data = await api.register({
          fullName,
          username,
          email,
          phone,
          password,
          referralUsername: referralUsername || undefined,
        });
      }
      localStorage.setItem("ayd_token", data.token);
      onAuthed(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg px-3.5 py-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] mb-3";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center">
            <Wifi size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold text-xl text-[#111827]">Abudeedart Yari Data</span>
        </div>
        <div className="bg-white border border-[#E5E9F0] rounded-2xl p-5 shadow-sm">
          <div className="flex mb-4 rounded-lg bg-[#F1F4F9] p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "login" ? "bg-[#2563EB] text-white" : "text-[#6B7280]"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "register" ? "bg-[#2563EB] text-white" : "text-[#6B7280]"
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === "register" && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                className={inputClass}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
