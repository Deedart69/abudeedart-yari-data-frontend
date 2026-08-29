const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (data) => request("/api/auth/register", { method: "POST", body: data }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  balance: (token) => request("/api/wallet/balance", { token }),
  fundInitialize: (token, amountNaira) =>
    request("/api/wallet/fund/initialize", { method: "POST", token, body: { amountNaira } }),
  fundVerify: (token, reference) => request(`/api/wallet/fund/verify/${reference}`, { token }),
  categories: (token, network) => request(`/api/purchase/categories/${network}`, { token }),
  plans: (token, network, category) =>
    request(`/api/purchase/plans/${network}?category=${category}`, { token }),
  buyAirtime: (token, { network, phone, amountNaira }) =>
    request("/api/purchase/airtime", { method: "POST", token, body: { network, phone, amountNaira } }),
  orders: (token) => request("/api/purchase/orders", { token }),
};
