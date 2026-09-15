import React, { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  Wallet,
  Plus,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  Signal,
  Receipt,
  Zap,
  GraduationCap,
  MessageSquare,
  Copy,
} from "lucide-react";
import { api } from "./api";

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", bg: "#FFF9E0" },
  { id: "airtel", name: "Airtel", color: "#FF3B30", bg: "#FFEBEA" },
  { id: "glo", name: "Glo", color: "#00A651", bg: "#E6F7ED" },
  { id: "9mobile", name: "9mobile", color: "#00A99D", bg: "#E0F6F4" },
];

const SERVICES = [
  { id: "data", label: "Buy Data", icon: Wifi, available: true },
  { id: "airtime", label: "Buy Airtime", icon: Smartphone, available: true },
  { id: "bills", label: "Pay Bills", icon: Receipt, available: false },
  { id: "electricity", label: "Electricity", icon: Zap, available: false },
  { id: "results", label: "Results Checker", icon: GraduationCap, available: false },
  { id: "sms", label: "Bulk SMS", icon: MessageSquare, available: false },
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
            className={inputClass}
          />

          {mode === "register" && (
            <>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={11}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Referral Username (optional)"
                value={referralUsername}
                onChange={(e) => setReferralUsername(e.target.value.replace(/\s/g, ""))}
                className={inputClass}
              />
            </>
          )}

          <input
            type="password"
            placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          {mode === "register" && (
            <>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              <label className="flex items-start gap-2 mb-4 text-xs text-[#6B7280]">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I agree to the Terms and Conditions and Privacy Policy</span>
              </label>
            </>
          )}

          {error && <div className="text-[#DC2626] text-xs mb-3">{error}</div>}

          <button
            onClick={submit}
            disabled={busy || (mode === "login" ? !email || password.length < 8 : !registerValid)}
            className="w-full rounded-lg py-3 bg-[#2563EB] text-white font-semibold disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main store ------------------------------------------------------------

function Store({ token, user, onLogout }) {
  const [balanceKobo, setBalanceKobo] = useState(user.wallet_balance);
  const [service, setService] = useState(null);
  const [network, setNetwork] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("gifting");
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [dedicatedAccount, setDedicatedAccount] = useState(null);
  const [dedicatedLoading, setDedicatedLoading] = useState(false);

  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };

  const refreshOrders = useCallback(async () => {
    try {
      const data = await api.orders(token);
      setOrders(data.orders);
    } catch {}
  }, [token]);

  useEffect(() => {
    refreshOrders();
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      api
        .fundVerify(token, reference)
        .then((data) => {
          setBalanceKobo(data.wallet_balance);
          showToast(data.status === "success" ? "Wallet funded successfully" : "Payment not confirmed");
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!network || service !== "data") return;
    api
      .categories(token, network)
      .then((data) => {
        setCategories(data.categories);
        const firstAvailable = data.categories.find((c) => c.available);
        setCategory(firstAvailable ? firstAvailable.id : data.categories[0]?.id || "gifting");
      })
      .catch(() => setCategories([]));
  }, [network, service, token]);

  useEffect(() => {
    if (!network || !category || service !== "data") return;
    setPlansLoading(true);
    setSelectedPlan(null);
    api
      .plans(token, network, category)
      .then((data) => setPlans(data.plans))
      .catch(() => showToast("Couldn't load plans — try again", "error"))
      .finally(() => setPlansLoading(false));
  }, [network, category, service, token]);

  // When the funding modal is opened, check if the user already has a
  // dedicated account, and poll briefly if one was just requested but
  // hasn't come back from Paystack's webhook yet.
  useEffect(() => {
    if (!topUpOpen) return;
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      try {
        const data = await api.getDedicatedAccount(token);
        if (cancelled) return;
        if (data.account_number) {
          setDedicatedAccount(data);
          setDedicatedLoading(false);
          return;
        }
      } catch {}
      attempts += 1;
      if (attempts < 6 && !cancelled) {
        setTimeout(check, 3000);
      } else if (!cancelled) {
        setDedicatedLoading(false);
      }
    };
    check();

    return () => {
      cancelled = true;
    };
  }, [topUpOpen, token]);

  const goBack = () => {
    setService(null);
    setNetwork(null);
    setCategory("gifting");
    setSelectedPlan(null);
    setPhone("");
    setAirtimeAmount("");
  };

  const handleRequestAccount = async () => {
    setDedicatedLoading(true);
    try {
      const data = await api.requestDedicatedAccount(token);
      if (data.already_exists) {
        setDedicatedAccount(data);
        setDedicatedLoading(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setDedicatedLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amt = parseInt(topUpAmount, 10);
    if (!amt || amt < 100) {
      showToast("Minimum top-up is ₦100", "error");
      return;
    }
    try {
      const data = await api.fundInitialize(token, amt);
      window.location.href = data.authorization_url;
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleBuyData = async () => {
    if (!selectedPlan) return showToast("Choose a data plan first", "error");
    if (phone.trim().length < 10) return showToast("Enter a valid phone number", "error");
    if (balanceKobo < selectedPlan.sale_naira * 100) return showToast("Insufficient wallet balance", "error");

    setBusy(true);
    try {
      const data = await api.buyData(token, { network, phone: phone.trim(), planCode: selectedPlan.code, category });
      setBalanceKobo(data.wallet_balance);
      if (data.status === "success") {
        showToast(`${selectedPlan.label} sent to ${phone.trim()}`);
      } else if (data.status === "pending") {
        showToast("Order is processing — check history shortly");
      } else {
        showToast(data.vtpass_message || "Purchase failed — you've been refunded", "error");
      }
      setSelectedPlan(null);
      setPhone("");
      refreshOrders();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleBuyAirtime = async () => {
    if (!network) return showToast("Choose a network first", "error");
    if (phone.trim().length < 10) return showToast("Enter a valid phone number", "error");
    const amt = parseInt(airtimeAmount, 10);
    if (!amt || amt < 50) return showToast("Minimum airtime is ₦50", "error");

    setBusy(true);
    try {
      const data = await api.buyAirtime(token, { network, phone: phone.trim(), amountNaira: amt });
      setBalanceKobo(data.wallet_balance);
      if (data.status === "success") {
        showToast(`₦${amt} airtime sent to ${phone.trim()}`);
      } else if (data.status === "pending") {
        showToast("Order is processing — check history shortly");
      } else {
        showToast(data.vtpass_message || "Purchase failed — you've been refunded", "error");
      }
      setPhone("");
      setAirtimeAmount("");
      refreshOrders();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const activeNet = NETWORKS.find((n) => n.id === network);
  const totalGBToday = orders
    .filter((o) => o.status === "success" && new Date(o.created_at).toDateString() === new Date().toDateString())
    .length;
  const activeService = SERVICES.find((s) => s.id === service);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#111827]">
      <header className="px-5 pt-6 pb-2 flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Wifi size={17} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Abudeedart Yari Data</span>
        </div>
        <button
          onClick={onLogout}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E9F0] bg-white text-[#6B7280]"
        >
          <LogOut size={15} />
        </button>
      </header>

      <main className="px-5 max-w-md mx-auto pb-16 pt-3">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setTopUpOpen(true)}
            className="bg-white rounded-2xl p-4 border border-[#E5E9F0] shadow-sm text-left"
          >
            <div className="w-9 h-9 rounded-full bg-[#EAF1FF] flex items-center justify-center mb-3">
              <Wallet size={16} className="text-[#2563EB]" />
            </div>
            <div className="text-[11px] text-[#6B7280] mb-0.5">Wallet Balance</div>
            <div className="font-bold text-lg">{fmt(balanceKobo)}</div>
          </button>
          <div className="bg-white rounded-2xl p-4 border border-[#E5E9F0] shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#EAF1FF] flex items-center justify-center mb-3">
              <Signal size={16} className="text-[#2563EB]" />
            </div>
            <div className="text-[11px] text-[#6B7280] mb-0.5">Orders Today</div>
            <div className="font-bold text-lg">{totalGBToday}</div>
          </div>
        </div>

        {service === null && (
          <>
            <div className="text-[13px] font-semibold text-[#374151] mb-3">Services</div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      s.available ? setService(s.id) : showToast(`${s.label} is coming soon`, "error")
                    }
                    className="bg-white rounded-2xl py-5 flex flex-col items-center gap-2.5 border border-[#E5E9F0] shadow-sm"
                    style={{ opacity: s.available ? 1 : 0.55 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EAF1FF] flex items-center justify-center">
                      <Icon size={22} className="text-[#2563EB]" strokeWidth={2.2} />
                    </div>
                    <span className="text-sm font-medium text-[#111827]">{s.label}</span>
                    {!s.available && <span className="text-[10px] text-[#9CA3AF]">Coming soon</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {service === "data" && (
          <>
            <button onClick={goBack} className="flex items-center gap-1 text-sm text-[#6B7280] mb-4">
              <ChevronLeft size={16} /> Back to services
            </button>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {NETWORKS.map((n) => {
                const active = n.id === network;
                return (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className="relative rounded-xl py-3 flex flex-col items-center gap-1.5 border transition-all bg-white"
                    style={{ borderColor: active ? n.color : "#E5E9F0", borderWidth: active ? 2 : 1 }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
