export const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Fix: Sập FE vì biến môi trường (Lỗi 48/45) và Lỗi Double Slash URL (Lỗi 49/34)

export const API_URL = (RAW_API_URL || "http://localhost:5263").replace(/\/+$/, "");
// Add `/api/v1` for versioning
export const BASE_URL = `${API_URL}/api/v1`;

function getAuthToken(customToken?: string): string | null {
  if (customToken) return customToken;
  return null;
}

interface ExtendedRequestInit extends RequestInit {
  timeoutMs?: number; // Cho phép API nặng (Báo cáo) kéo dài timeout thay vì lock chết ở 15s (Lỗi Timeout Báo cáo)
}

// Bắn event để xử lý lỗi 401 mượt mà ở client
export const emitAuthError = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event('auth_error_401'));
  }
};

async function fetchFromApi(endpoint: string, options: ExtendedRequestInit = {}) {
  // Cấu hình linh hoạt Timeout. Báo cáo kế toán cho 60s, CRUD bình thường 15s.
  const timeoutLimit = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Tự động đính kèm HttpOnly cookies
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return Promise.reject(new Error("Request timed out. Vui lòng thử lại sau."));
      }
      return Promise.reject(new Error(`Network Error: ${error.message}`));
    }
    return Promise.reject(new Error(`Network Error: ${String(error)}`));
  } finally {
    clearTimeout(timeoutId);
  }

  // Fix Bắt lỗi thả trôi (Lỗi 52/17)
  if (!response.ok) {
    if (response.status === 401) {
      emitAuthError(); // Dùng event thay vì gán window.location cứng nhắc làm giật trang
      return Promise.reject(new Error("Unauthorized")); // Sửa Lỗi 5: Đóng promise để tránh Memory Leak
    }
    if (response.status === 403) {
      return Promise.reject(new Error("Bạn không có quyền thực hiện hành động này (403)."));
    }
    if (response.status === 429) {
      return Promise.reject(new Error("Hệ thống đang quá tải, vui lòng thử lại sau (429)."));
    }

    let errorDetail = response.statusText;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorDetail += ` - ${errorBody}`;
      }
    } catch (e) {
      // Ignore body read error
    }
    return Promise.reject(new Error(`API error (${response.status}): ${errorDetail}`));
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
  auth: {
    me: () => fetchFromApi('/auth/me'),
    createStaff: (data: any) => fetchFromApi('/auth/staff', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchFromApi('/auth/logout', { method: 'POST' }),
  },
  products: {
    // Bối cảnh 4: Fix Pagination Metadata, giữ nguyên Object DTO có TotalCount để Frontend Pagination có thể đọc
    // Lỗi 63: Truyền token vào cho Next.js Server Components có chỗ pass cookie
    list: async (page: number = 1, limit: number = 100) => {
      const res = await fetchFromApi(`/products?page=${page}&limit=${limit}`);
      return res; // Không tự ý gọt dữ liệu, để Client UI lấy res.data và res.totalCount
    },
    get: (id: string) => fetchFromApi(`/products/${id}`),
    create: (data: any) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchFromApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchFromApi(`/products/${id}`, { method: 'DELETE' }),
    categories: () => fetchFromApi('/products/categories'),
    createCategory: (data: any) => fetchFromApi('/products/categories', { method: 'POST', body: JSON.stringify(data) }),
    createMapping: (id: string, data: any) => fetchFromApi(`/products/${id}/mappings`, { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    batches: async (page: number = 1, limit: number = 100) => {
      const res = await fetchFromApi(`/inventory/batches?page=${page}&limit=${limit}`);
      return res;
    },
    createBatch: (data: any) => fetchFromApi('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
    createPurchaseOrder: (data: any) => fetchFromApi('/inventory/purchases', { method: 'POST', body: JSON.stringify(data) }),
    receivePurchaseOrder: (id: string) => fetchFromApi(`/inventory/purchases/${id}/receive`, { method: 'POST' }),
  },
  orders: {
    list: async (page: number = 1, limit: number = 100) => {
      const res = await fetchFromApi(`/orders?page=${page}&limit=${limit}`);
      return res;
    },
    create: (data: any) => fetchFromApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    createPOS: (data: any) => fetchFromApi('/orders/pos', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: string, reason: string) => fetchFromApi(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify(reason) }),
    returnOrder: (id: string) => fetchFromApi(`/orders/${id}/return`, { method: 'POST' }),
    confirmOrder: (id: string, shippingMethod: string) => fetchFromApi(`/orders/${id}/confirm`, { method: 'POST', body: JSON.stringify(shippingMethod) }),
  },
  finance: {
    expenses: async (page: number = 1, limit: number = 100) => {
      const res = await fetchFromApi(`/finance/expenses?page=${page}&limit=${limit}`);
      return res;
    },

    profitReport: (start: string, end: string) =>
      fetchFromApi(`/finance/profit-report?startDate=${start}&endDate=${end}`, {
        timeoutMs: 60000 // Tăng timeout cho báo cáo kế toán nặng
      }),
    reconciliation: () => fetchFromApi(`/finance/reconciliation`),
  },
  chat: {
    sessions: () => fetchFromApi('/chat/sessions'),
    messages: (id: string) => fetchFromApi(`/chat/sessions/${id}/messages`),
    sendMessage: (id: string, text: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ messageText: text }) }),
  },
  promotions: {
    createVoucher: (data: any) => fetchFromApi('/promotions/voucher', { method: 'POST', body: JSON.stringify(data) }),
    createFlashSale: (data: any) => fetchFromApi('/promotions/flash-sale', { method: 'POST', body: JSON.stringify(data) })
  },
  reviews: {
    list: () => fetchFromApi('/reviews'),
    reply: (id: string, text: string) => fetchFromApi(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify(text) })
  }
};
