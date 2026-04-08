const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Fix: Sập FE vì biến môi trường (Lỗi 48/45) và Lỗi Double Slash URL (Lỗi 49/34)

const API_URL = (RAW_API_URL || "http://localhost:5248").replace(/\/$/, "");
// Add `/api/v1` for versioning
const BASE_URL = `${API_URL}/api/v1`;

// Dùng function getAuthToken an toàn. Tránh dùng document.cookie trực tiếp phòng chống XSS.
// Ưu tiên đọc từ LocalStorage, NextJS xử lý HttpOnly cookie thì gửi tự động qua fetch credentials (nếu cấu hình),
// hoặc pass customToken từ SSR Server Component.
function getAuthToken(customToken?: string): string | null {
  if (customToken) return customToken;

  if (typeof window !== "undefined") {
    // Chỉ đọc từ LocalStorage. Tránh parse document.cookie (chống XSS)
    return localStorage.getItem("access_token");
  }

  return null;
}

interface ExtendedRequestInit extends RequestInit {
  token?: string;
  timeoutMs?: number; // Cho phép API nặng (Báo cáo) kéo dài timeout thay vì lock chết ở 15s (Lỗi Timeout Báo cáo)
}

async function fetchFromApi(endpoint: string, options: ExtendedRequestInit = {}) {
  // Cấu hình linh hoạt Timeout. Báo cáo kế toán cho 60s, CRUD bình thường 15s.
  const timeoutLimit = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

  const token = getAuthToken(options.token);
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Bối cảnh 4: Đuổi việc nhân viên Kế toán bằng UX tồi
  // Thay vì `throw new Error` gây trắng màn hình, ta redirect trực tiếp hoặc trả về null an toàn
  // cho phép UI NextJS xử lý mềm mại hơn
  if (!token) {
    if (typeof window !== "undefined") {
      window.location.assign('/login');
      // Trả về promise không bao giờ resolve để ngăn hook React/SWR bị gãy trong lúc đợi điều hướng
      return new Promise(() => {});
    } else {
      // Ở SSR, không throw error làm sập layout server.
      // Dựa trên Middleware của Next.js để chặn và redirect trước.
      // Nếu lọt xuống đây, trả về object dummy cấu trúc chuẩn để tránh TypeErrors (ví dụ: null.map is not a function)
      console.warn(`[SSR Auth Missing] Cannot fetch ${endpoint}. Please pass customToken from next/headers.`);
      return { data: [], totalCount: 0, _ssrAuthFailed: true };
    }
  }


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
      if (typeof window !== "undefined") {
         window.location.assign('/login');
         return new Promise(() => {});
      }

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
    // Bối cảnh 4: Fix Pagination Metadata, giữ nguyên Object DTO có TotalCount để Frontend Pagination có thể đọc
    // Lỗi 63: Truyền token vào cho Next.js Server Components có chỗ pass cookie
    list: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/products?page=${page}&limit=${limit}`, { token: customToken });
      return res; // Không tự ý gọt dữ liệu, để Client UI lấy res.data và res.totalCount
    },
    get: (id: string, customToken?: string) => fetchFromApi(`/products/${id}`, { token: customToken }),
    create: (data: any, customToken?: string) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    update: (id: string, data: any, customToken?: string) => fetchFromApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data), token: customToken }),
    delete: (id: string, customToken?: string) => fetchFromApi(`/products/${id}`, { method: 'DELETE', token: customToken }),
    categories: (customToken?: string) => fetchFromApi('/products/categories', { token: customToken }),
    createMapping: (id: string, data: any, customToken?: string) => fetchFromApi(`/products/${id}/mappings`, { method: 'POST', body: JSON.stringify(data), token: customToken }),
  },
  inventory: {
    batches: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/inventory/batches?page=${page}&limit=${limit}`, { token: customToken });
      return res;
    },
    createBatch: (data: any, customToken?: string) => fetchFromApi('/inventory/batches', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    createPurchaseOrder: (data: any, customToken?: string) => fetchFromApi('/inventory/purchases', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    receivePurchaseOrder: (id: string, customToken?: string) => fetchFromApi(`/inventory/purchases/${id}/receive`, { method: 'POST', token: customToken }),
  },
  orders: {
    list: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/orders?page=${page}&limit=${limit}`, { token: customToken });
      return res;
    },
    create: (data: any, customToken?: string) => fetchFromApi('/orders', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    createPOS: (data: any, customToken?: string) => fetchFromApi('/orders/pos', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    cancel: (id: string, reason: string, customToken?: string) => fetchFromApi(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify(reason), token: customToken }),
    returnOrder: (id: string, customToken?: string) => fetchFromApi(`/orders/${id}/return`, { method: 'POST', token: customToken }),
    confirmOrder: (id: string, shippingMethod: string, customToken?: string) => fetchFromApi(`/orders/${id}/confirm`, { method: 'POST', body: JSON.stringify(shippingMethod), token: customToken }),
  },
  finance: {
    expenses: async (page: number = 1, limit: number = 100, customToken?: string) => {
      const res = await fetchFromApi(`/finance/expenses?page=${page}&limit=${limit}`, { token: customToken });
      return res;
    },

    profitReport: (start: string, end: string, customToken?: string) =>
      fetchFromApi(`/finance/profit-report?startDate=${start}&endDate=${end}`, {
        token: customToken,
        timeoutMs: 60000 // Tăng timeout cho báo cáo kế toán nặng
      }),
    reconciliation: (customToken?: string) => fetchFromApi(`/finance/reconciliation`, { token: customToken }),
  },
  chat: {
    sessions: (customToken?: string) => fetchFromApi('/chat/sessions', { token: customToken }),
    messages: (id: string, customToken?: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { token: customToken }),
    sendMessage: (id: string, text: string, customToken?: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ messageText: text }), token: customToken }),
  },
  promotions: {
    createVoucher: (data: any, customToken?: string) => fetchFromApi('/promotions/voucher', { method: 'POST', body: JSON.stringify(data), token: customToken }),
    createFlashSale: (data: any, customToken?: string) => fetchFromApi('/promotions/flash-sale', { method: 'POST', body: JSON.stringify(data), token: customToken })
  },
  reviews: {
    list: (customToken?: string) => fetchFromApi('/reviews', { token: customToken }),
    reply: (id: string, text: string, customToken?: string) => fetchFromApi(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify(text), token: customToken })
  }
};
