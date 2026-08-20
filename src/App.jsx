import React, { useState, useEffect, useCallback } from "react";
import { Wifi, Wallet, Plus, Check, Clock, Smartphone, ChevronRight, X, LogOut } from "lucide-react";
import { api } from "./api";

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", dark: "#3a2f00" },
  { id: "airtel", name: "Airtel", color: "#FF3B30", dark: "#3a0b08" },
  { id: "glo", name: "Glo", color: "#3DDC5A", dark: "#0a2712" },
  { id: "9mobile", name: "9mobile", color: "#3AC0C4", dark: "#062727" },
];

const fmt = (kobo) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    kobo / 100
  );

function SignalGauge({ level }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-end gap-[3px] h-6">
      {bars.map((b) => (
        <div
          key={b}
          className="w-[5px] rounded-sm transition-all duration-500 ease-out"
          style={{
            height: `${(b + 1) * 20}%`,
            backgroundColor: b < level ? "#33FF99" : "#2A2F5C",
            boxShadow: b < level ? "0 0 8px #33FF9990" : "none",
          }}
        />
      ))}
    </div>
  );
}

function sizeToLevel(label) {
  const n = parseFloat(label);
  const isGB = label.toUpperCase().includes("GB");
  const mb = isGB ? n * 1024 : n;
  if (mb < 700) return 1;
  if (mb < 2500) return 2;
  if (mb < 6000) return 3;
  if (mb < 15000) return 4;
  return 5;
}

// --- Auth screen ---------------------------------------------------------

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const fn = mode === "login" ? api.login : api.register;
      const data = await fn(email, password);
      localStorage.setItem("ayd_token", data.token);
      onAuthed(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D24] px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-[#33FF99] flex items-center justify-center">
            <Wifi size={18} strokeWidth={2.5} className="text-[#0B0D24]" />
          </div>
          <span className="display-font font-bold text-xl text-[#EDEEFB]">Abudeedart Yari Data</span>
        </div>
        <div className="bg-[#171A3D] border border-[#2A2F5C] rounded-2xl p-5">
          <div className="flex mb-4 rounded-lg bg-[#0B0D24] p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "login" ? "bg-[#33FF99] text-[#0B0D24]" : "text-[#5B6091]"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "register" ? "bg-[#33FF99] text-[#0B0D24]" : "text-[#5B6091]"
              }`}
            >
              Sign up
            </button>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0B0D24] border border-[#2A2F5C] rounded-lg px-3.5 py-3 text-sm text-[#EDEEFB] outline-none focus:border-[#33FF99] mb-3"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0B0D24] border border-[#2A2F5C] rounded-lg px-3.5 py-3 text-sm text-[#EDEEFB] outline-none focus:border-[#33FF99] mb-4"
          />
          {error && <div className="text-[#FF6B6B] text-xs mb-3">{error}</div>}
          <button
            onClick={submit}
            disabled={busy || !email || password.length < 8}
            className="w-full rounded-lg py-3 bg-[#33FF99] text-[#0B0D24] font-semibold display-font disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main store ------------------------------------------------------------

function Store({ token, user, onLogout }) {
  const [balanceKobo, setBalanceKobo] = useState(user.wallet_balance);
  const [network, setNetwork] = useState("mtn");
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };

  const refreshBalance = useCallback(async () => {
    try {
      const data = await api.balance(token);
      setBalanceKobo(data.wallet_balance);
    } catch {}
  }, [token]);

  const refreshOrders = useCallback(async () => {
    try {
      const data = await api.orders(token);
      setOrders(data.orders);
    } catch {}
  }, [token]);

  useEffect(() => {
    refreshOrders();
    // If we just came back from Paystack, the URL will have ?reference=...
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
    setPlansLoading(true);
    setSelectedPlan(null);
    api
      .plans(token, network)
      .then((data) => setPlans(data.plans))
      .catch(() => showToast("Couldn't load plans — try again", "error"))
      .finally(() => setPlansLoading(false));
  }, [network, token]);

  const handleTopUp = async () => {
    const amt = parseInt(topUpAmount, 10);
    if (!amt || amt < 100) {
      showToast("Minimum top-up is ₦100", "error");
      return;
    }
    try {
      const data = await api.fundInitialize(token, amt);
      window.location.href = data.authorization_url; // send them to Paystack checkout
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleBuy = async () => {
    if (!selectedPlan) return showToast("Choose a data plan first", "error");
    if (phone.trim().length < 10) return showToast("Enter a valid phone number", "error");
    if (balanceKobo < selectedPlan.sale_naira * 100) return showToast("Insufficient wallet balance", "error");

    setBusy(true);
    try {
      const data = await api.buyData(token, { network, phone: phone.trim(), planCode: selectedPlan.code });
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

  const activeNet = NETWORKS.find((n) => n.id === network);

  return (
    <div
      className="min-h-screen text-[#EDEEFB]"
      style={{ background: "radial-gradient(ellipse at top, #12143f 0%, #0B0D24 60%)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#33FF99] flex items-center justify-center">
            <Wifi size={17} strokeWidth={2.5} className="text-[#0B0D24]" />
          </div>
          <span className="display-font font-bold text-lg tracking-tight">Abudeedart Yari Data</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-1.5 bg-[#171A3D] border border-[#2A2F5C] rounded-full px-3 py-1.5 hover:border-[#33FF99] transition-colors"
          >
            <Wallet size={14} className="text-[#33FF99]" />
            <span className="mono-font text-sm">{fmt(balanceKobo)}</span>
            <Plus size={13} className="text-[#5B6091]" />
          </button>
          <button
            onClick={onLogout}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#2A2F5C] text-[#5B6091] hover:text-[#EDEEFB]"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main className="px-5 max-w-md mx-auto pb-16">
        <div className="grid grid-cols-4 gap-2 mb-6">
          {NETWORKS.map((n) => {
            const active = n.id === network;
            return (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className="relative rounded-xl py-3 flex flex-col items-center gap-1.5 border transition-all"
                style={{ borderColor: active ? n.color : "#22254d", backgroundColor: active ? n.dark : "#12143f" }}
              >
                <div className="w-5 h-3.5 rounded-[3px]" style={{ backgroundColor: n.color, opacity: active ? 1 : 0.5 }} />
                <span className="text-[10px] font-medium tracking-wide" style={{ color: active ? n.color : "#5B6091" }}>
                  {n.name}
                </span>
                {active && <Check size={10} className="absolute top-1.5 right-1.5" style={{ color: n.color }} />}
              </button>
            );
          })}
        </div>

        <div className="mb-6">
          <label className="text-[11px] uppercase tracking-widest text-[#5B6091] mb-2 block">Recipient number</label>
          <div
            className="flex items-center gap-2 rounded-xl px-3.5 py-3 border"
            style={{ borderColor: phone ? activeNet.color + "80" : "#22254d", backgroundColor: "#12143f" }}
          >
            <Smartphone size={16} className="text-[#5B6091]" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0803 123 4567"
              maxLength={11}
              className="bg-transparent outline-none flex-1 mono-font text-sm placeholder:text-[#3D4173]"
            />
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-[#5B6091]">{activeNet.name} data plans</span>
          <SignalGauge level={selectedPlan ? sizeToLevel(selectedPlan.label) : 0} />
        </div>

        {plansLoading ? (
          <div className="text-[#5B6091] text-sm mb-6">Loading live plans…</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {plans.map((p) => {
              const active = selectedPlan?.code === p.code;
              return (
                <button
                  key={p.code}
                  onClick={() => setSelectedPlan(p)}
                  className="text-left rounded-xl p-3.5 border transition-all"
                  style={{ borderColor: active ? activeNet.color : "#22254d", backgroundColor: active ? activeNet.dark : "#12143f" }}
                >
                  <div className="display-font font-bold text-base leading-tight mb-1.5">{p.label}</div>
                  <div
                    className="mono-font text-sm font-medium"
                    style={{ color: active ? activeNet.color : "#EDEEFB" }}
                  >
                    ₦{p.sale_naira.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={busy}
          className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-semibold display-font transition-all disabled:opacity-60"
          style={{ backgroundColor: activeNet.color, color: "#0B0D24" }}
        >
          {busy ? "Sending…" : (
            <>
              Buy {selectedPlan ? selectedPlan.label : "data"}
              {selectedPlan && <span className="mono-font">· ₦{selectedPlan.sale_naira.toLocaleString()}</span>}
              <ChevronRight size={16} />
            </>
          )}
        </button>

        {orders.length > 0 && (
          <div className="mt-10">
            <span className="text-[11px] uppercase tracking-widest text-[#5B6091] mb-3 block">Recent purchases</span>
            <div className="flex flex-col gap-2">
              {orders.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg px-3.5 py-3 border border-[#22254d] bg-[#12143f]">
                  <div>
                    <div className="text-sm font-medium">{o.plan_label} · {o.network}</div>
                    <div className="mono-font text-[11px] text-[#5B6091]">{o.phone} · {o.status}</div>
                  </div>
                  <div className="mono-font text-xs text-[#5B6091]">{fmt(o.sale_price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {topUpOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#171A3D] border border-[#2A2F5C] rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="display-font font-bold">Fund wallet</span>
              <button onClick={() => setTopUpOpen(false)}>
                <X size={18} className="text-[#5B6091]" />
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              {[1000, 2000, 5000, 10000].map((v) => (
                <button key={v} onClick={() => setTopUpAmount(String(v))} className="flex-1 rounded-lg py-2 text-xs mono-font border border-[#2A2F5C] hover:border-[#33FF99] transition-colors">
                  ₦{v / 1000}k
                </button>
              ))}
            </div>
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-[#0B0D24] border border-[#2A2F5C] rounded-lg px-3.5 py-3 mono-font text-sm outline-none focus:border-[#33FF99] mb-4"
            />
            <button onClick={handleTopUp} className="w-full rounded-lg py-3 bg-[#33FF99] text-[#0B0D24] font-semibold display-font">
              Continue to Paystack
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium z-50 shadow-lg"
          style={{
            backgroundColor: toast.kind === "error" ? "#2A0F14" : "#0F2A1C",
            color: toast.kind === "error" ? "#FF6B6B" : "#33FF99",
            border: `1px solid ${toast.kind === "error" ? "#FF6B6B40" : "#33FF9940"}`,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("ayd_token"));
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .balance(token)
      .then((data) => setUser({ wallet_balance: data.wallet_balance }))
      .catch(() => {
        localStorage.removeItem("ayd_token");
        setToken(null);
      })
      .finally(() => setChecking(false));
  }, [token]);

  const handleAuthed = (tok, u) => {
    setToken(tok);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("ayd_token");
    setToken(null);
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B0D24] flex items-center justify-center">
        <div className="text-[#5B6091] font-mono text-sm tracking-widest animate-pulse">CONNECTING…</div>
      </div>
    );
  }

  if (!token || !user) return <AuthScreen onAuthed={handleAuthed} />;
  return <Store token={token} user={user} onLogout={handleLogout} />;
}
