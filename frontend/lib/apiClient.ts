const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Fix: Sập FE vì biến môi trường (Lỗi 48/45) và Lỗi Double Slash URL (Lỗi 49/34)
const API_URL = (RAW_API_URL || "http://localhost:5248").replace(/\/$/, "");
// Add `/api/v1` for versioning
const BASE_URL = `${API_URL}/api/v1`;

// Fix Lỗi 58: Sửa hàm lấy token để tương thích Next.js SSR / Server Components
// Dùng function regex parse document.cookie hoặc check headers server.
function getAuthToken(customToken?: string): string | null {
  if (customToken) return customToken;

  if (typeof window !== "undefined") {
    // 1. Client Side: Check LocalStorage trước
    const lsToken = localStorage.getItem("access_token");
    if (lsToken) return lsToken;

    // 2. Client Side: Check Cookie fallback
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) return match[2];
  }

  // Ở Server Component (SSR), nếu không pass customToken vào, sẽ return null.
  // Developers khi gọi api.products.list() ở Server Page bắt buộc phải parse cookie từ Next `headers()`
  // và gắn vào bằng một wrapper khác, hoặc call api qua route handler.
  return null;
}

// Bổ sung `token` vào RequestInit để SSR Next.js có thể inject token lấy từ `cookies()`
interface ExtendedRequestInit extends RequestInit {
  token?: string;
}

async function fetchFromApi(endpoint: string, options: ExtendedRequestInit = {}) {
  // Fix Thiếu Timeout API (Lỗi 54) bằng AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  const token = getAuthToken(options.token);
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
    // Lỗi 60: Bổ sung Metadata TotalCount, trả về .data để UI không sập khi expect Array.
    // Lỗi 63: Truyền token vào cho Next.js Server Components có chỗ pass cookie
    list: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/products?page=${page}&limit=${limit}`, { token: customToken });
      return res.data ? res.data : res; // Tương thích ngược nếu API chưa update kịp
    },
    get: (id: string, customToken?: string) => fetchFromApi(`/products/${id}`, { token: customToken }),
    create: (data: any, customToken?: string) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data), token: customToken }),
  },
  inventory: {
    batches: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/inventory/batches?page=${page}&limit=${limit}`, { token: customToken });
      return res.data ? res.data : res;
    },
    createBatch: (data: any, customToken?: string) => fetchFromApi('/inventory/batches', { method: 'POST', body: JSON.stringify(data), token: customToken }),
  },
  orders: {
    list: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/orders?page=${page}&limit=${limit}`, { token: customToken });
      return res.data ? res.data : res;
    },
    create: (data: any, customToken?: string) => fetchFromApi('/orders', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    createPOS: (data: any, customToken?: string) => fetchFromApi('/orders/pos', { method: 'POST', body: JSON.stringify(data), token: customToken }),
  },
  finance: {
    expenses: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/finance/expenses?page=${page}&limit=${limit}`, { token: customToken });
      return res.data ? res.data : res;
    },
    profitReport: (start: string, end: string, customToken?: string) => fetchFromApi(`/finance/profit-report?startDate=${start}&endDate=${end}`, { token: customToken }),
  },
  chat: {
    sessions: (customToken?: string) => fetchFromApi('/chat/sessions', { token: customToken }),
    messages: (id: string, customToken?: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { token: customToken }),
    sendMessage: (id: string, text: string, customToken?: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ messageText: text }), token: customToken }),
  }
};
