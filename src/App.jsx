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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] px-5">
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
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg px-3.5 py-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] mb-3"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg px-3.5 py-3 text-sm text-[#111827] outline-none focus:border-[#2563EB] mb-4"
          />
          {error && <div className="text-[#DC2626] text-xs mb-3">{error}</div>}
          <button
            onClick={submit}
            disabled={busy || !email || password.length < 8}
            className="w-full rounded-lg py-3 bg-[#2563EB] text-white font-semibold disabled:opacity-50"
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
  const [network, setNetwork] = useState(null);
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
    if (!network) return;
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
      window.location.href = data.authorization_url;
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
  const totalGBToday = orders
    .filter((o) => o.status === "success" && new Date(o.created_at).toDateString() === new Date().toDateString())
    .length;

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
        {/* Balance + stats cards, like the reference screenshot */}
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

        {/* Services grid — icon tiles like the reference */}
        <div className="text-[13px] font-semibold text-[#374151] mb-3">Buy Data</div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {NETWORKS.map((n) => {
            const active = n.id === network;
            return (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className="bg-white rounded-2xl py-5 flex flex-col items-center gap-2.5 border shadow-sm transition-all"
                style={{ borderColor: active ? n.color : "#E5E9F0", borderWidth: active ? 2 : 1 }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: n.bg }}
                >
                  <Wifi size={22} style={{ color: n.color }} strokeWidth={2.2} />
                </div>
                <span className="text-sm font-medium text-[#111827]">{n.name}</span>
              </button>
            );
          })}
        </div>

        {network && (
          <>
            <div className="mb-5">
              <label className="text-[11px] uppercase tracking-widest text-[#6B7280] mb-2 block">
                Recipient number
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-3.5 py-3 border bg-white"
                style={{ borderColor: phone ? activeNet.color : "#E5E9F0" }}
              >
                <Smartphone size={16} className="text-[#6B7280]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0803 123 4567"
                  maxLength={11}
                  className="bg-transparent outline-none flex-1 text-sm placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="mb-3 text-[11px] uppercase tracking-widest text-[#6B7280]">
              {activeNet.name} data plans
            </div>

            {plansLoading ? (
              <div className="text-[#6B7280] text-sm mb-6">Loading live plans…</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {plans.map((p) => {
                  const active = selectedPlan?.code === p.code;
                  return (
                    <button
                      key={p.code}
                      onClick={() => setSelectedPlan(p)}
                      className="text-left rounded-xl p-3.5 border bg-white transition-all"
                      style={{ borderColor: active ? activeNet.color : "#E5E9F0", borderWidth: active ? 2 : 1 }}
                    >
                      <div className="font-bold text-base leading-tight mb-1.5">{p.label}</div>
                      <div className="text-sm font-medium" style={{ color: active ? activeNet.color : "#111827" }}>
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
              className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-60 text-white"
              style={{ backgroundColor: activeNet.color }}
            >
              {busy ? "Sending…" : (
                <>
                  Buy {selectedPlan ? selectedPlan.label : "data"}
                  {selectedPlan && <span>· ₦{selectedPlan.sale_naira.toLocaleString()}</span>}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </>
        )}

        {orders.length > 0 && (
          <div className="mt-10">
            <div className="text-[13px] font-semibold text-[#374151] mb-3">Recent purchases</div>
            <div className="flex flex-col gap-2">
              {orders.slice(0, 8).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl px-3.5 py-3 border border-[#E5E9F0] bg-white"
                >
                  <div>
                    <div className="text-sm font-medium">{o.plan_label} · {o.network}</div>
                    <div className="text-[11px] text-[#6B7280]">{o.phone} · {o.status}</div>
                  </div>
                  <div className="text-xs text-[#6B7280]">{fmt(o.sale_price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {topUpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-[#E5E9F0]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">Fund wallet</span>
              <button onClick={() => setTopUpOpen(false)}>
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              {[1000, 2000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  onClick={() => setTopUpAmount(String(v))}
                  className="flex-1 rounded-lg py-2 text-xs border border-[#E5E9F0] hover:border-[#2563EB] transition-colors"
                >
                  ₦{v / 1000}k
                </button>
              ))}
            </div>
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg px-3.5 py-3 text-sm outline-none focus:border-[#2563EB] mb-4"
            />
            <button onClick={handleTopUp} className="w-full rounded-lg py-3 bg-[#2563EB] text-white font-semibold">
              Continue to Paystack
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium z-50 shadow-lg"
          style={{
            backgroundColor: toast.kind === "error" ? "#FEF2F2" : "#F0FDF4",
            color: toast.kind === "error" ? "#DC2626" : "#16A34A",
            border: `1px solid ${toast.kind === "error" ? "#FCA5A5" : "#86EFAC"}`,
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
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-[#6B7280] text-sm tracking-widest animate-pulse">CONNECTING…</div>
      </div>
    );
  }

  if (!token || !user) return <AuthScreen onAuthed={handleAuthed} />;
  return <Store token={token} user={user} onLogout={handleLogout} />;
}
