const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  products: {
    list: () => fetchFromApi('/products'),
    get: (id: string) => fetchFromApi(`/products/${id}`),
    create: (data: any) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    batches: () => fetchFromApi('/inventory/batches'),
    createBatch: (data: any) => fetchFromApi('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  },
  orders: {
    list: () => fetchFromApi('/orders'),
    create: (data: any) => fetchFromApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    createPOS: (data: any) => fetchFromApi('/orders/pos', { method: 'POST', body: JSON.stringify(data) }),
  },
  finance: {
    expenses: () => fetchFromApi('/finance/expenses'),
    profitReport: (start: string, end: string) => fetchFromApi(`/finance/profit-report?startDate=${start}&endDate=${end}`),
  },
  chat: {
    sessions: () => fetchFromApi('/chat/sessions'),
    messages: (id: string) => fetchFromApi(`/chat/sessions/${id}/messages`),
    sendMessage: (id: string, text: string) => fetchFromApi(`/chat/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ messageText: text }) }),
  }
};
