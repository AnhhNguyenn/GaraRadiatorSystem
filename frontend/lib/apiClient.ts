const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Fix: Sập FE vì biến môi trường (Lỗi 48/45) và Lỗi Double Slash URL (Lỗi 49/34)
const API_URL = (RAW_API_URL || "http://localhost:5248").replace(/\/$/, "");
// Add `/api/v1` for versioning
const BASE_URL = `${API_URL}/api/v1`;

// Hàm lấy token từ bộ nhớ (localStorage, cookie, hoặc session)
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  // Fix Thiếu Timeout API (Lỗi 54) bằng AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Fix Gọi API không cần xác thực (Lỗi 51/16)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("Request timed out. Vui lòng thử lại sau.");
    }
    throw new Error(`Network Error: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fix Bắt lỗi thả trôi (Lỗi 52/17)
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Phiên đăng nhập hết hạn (401).");
    }
    if (response.status === 403) {
      throw new Error("Bạn không có quyền thực hiện hành động này (403).");
    }
    if (response.status === 429) {
      throw new Error("Hệ thống đang quá tải, vui lòng thử lại sau (429).");
    }
    throw new Error(`API error (${response.status}): ${response.statusText}`);
  }

  // Fix Cú lừa JSON Parser (Lỗi 53/19)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    return response.text();
  }
}

export const api = {
  products: {
    // Fix Kéo dữ liệu vô cực (Lỗi 50/33)
    list: (page: number = 1, limit: number = 100) => fetchFromApi(`/products?page=${page}&limit=${limit}`),
    get: (id: string) => fetchFromApi(`/products/${id}`),
    create: (data: any) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    batches: (page: number = 1, limit: number = 100) => fetchFromApi(`/inventory/batches?page=${page}&limit=${limit}`),
    createBatch: (data: any) => fetchFromApi('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  },
  orders: {
    list: (page: number = 1, limit: number = 100) => fetchFromApi(`/orders?page=${page}&limit=${limit}`),
    create: (data: any) => fetchFromApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    createPOS: (data: any) => fetchFromApi('/orders/pos', { method: 'POST', body: JSON.stringify(data) }),
  },
  finance: {
    expenses: (page: number = 1, limit: number = 100) => fetchFromApi(`/finance/expenses?page=${page}&limit=${limit}`),
    profitReport: (start: string, end: string) => fetchFromApi(`/finance/profit-report?startDate=${start}&endDate=${end}`),
  },
  chat: {
    sessions: () => fetchFromApi('/chat/sessions'),
    messages: (id: string) => fetchFromApi(`/chat/sessions/${id}/messages`),
    sendMessage: (id: string, text: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ messageText: text }) }),
  }
};
