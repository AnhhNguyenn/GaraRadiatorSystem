'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingCart, Printer, CreditCard, User, Package } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface CartItem {
  product: any;
  quantity: number;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: 'Khách lẻ', phone: '' });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    
    // Đăng ký Phím tắt (Hotkeys)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Focus Search
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F8: Thanh toán nhanh
      if (e.key === 'F8') {
        e.preventDefault();
        document.getElementById('checkout-btn')?.click();
      }
      // F9: In hóa đơn giả định (Nếu đã thanh toán xong)
      if (e.key === 'F9') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Giỏ hàng trống!');
    try {
      const payload = {
        source: 'POS',
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price || 0
        }))
      };
      
      const res = await api.orders.createPOS(payload);
      alert('Tạo đơn hàng POS thành công! ID: ' + res.id + '\nNhấn OK hoặc F9 để in hóa đơn.');
      window.print();
      setCart([]);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tạo đơn hàng POS');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);

  const filteredProducts = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 print:block print:h-auto">
      {/* Left: Products (Hidden on Print) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="F1: Tìm sản phẩm (Tên, Mã SKU)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>
          <div className="text-sm font-medium text-slate-500 hidden xl:block">
            Mẹo: Dùng F1 tìm kiếm, F8 thanh toán, F9 in hóa đơn.
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="h-28 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                  <Package className="h-10 w-10 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="font-medium text-slate-900 line-clamp-2 text-sm">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">{p.sku}</div>
                <div className="mt-2 text-sm font-bold text-indigo-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || 0)}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500">
                Không tìm thấy sản phẩm nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart (Hidden on Print) */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Giỏ hàng
          </h2>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">{cart.length} nhóm.</span>
        </div>

        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={customerInfo.name}
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="flex-1 border-none outline-none focus:ring-0 p-0 text-slate-900 font-medium bg-transparent"
              placeholder="Tên khách hàng"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
              <p>Chưa có sản phẩm nào</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.product.name}</h4>
                  <div className="text-indigo-600 font-medium text-sm mt-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product.price || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-md bg-white">
                    <button 
                      onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-50 font-medium"
                    >-</button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-50 font-medium"
                    >+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500">Tổng thanh toán</span>
            <span className="text-2xl font-bold text-indigo-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
            </span>
          </div>
          
          <button 
            id="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 group"
          >
            <CreditCard className="h-5 w-5" />
            THANH TOÁN (F8)
          </button>
        </div>
      </div>

      {/* Print Overlay (Visible ONLY on print) */}
      <div className="hidden print:block w-[80mm] text-black text-xs font-sans mx-auto">
        <h1 className="text-center font-bold text-xl mb-1">GARAGE RADIATOR</h1>
        <p className="text-center text-sm mb-3">HÓA ĐƠN BÁN HÀNG</p>
        
        <div className="border-b border-dashed border-black pb-2 mb-2 text-[10px]">
          <p>Khách hàng: <strong>{customerInfo.name}</strong></p>
          <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <table className="w-full mb-3 text-[10px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left font-bold py-1">SL</th>
              <th className="text-left font-bold py-1">Tên SP</th>
              <th className="text-right font-bold py-1">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.product.id} className="border-b border-dashed border-gray-300">
                <td className="py-2 inline-block align-top">{item.quantity}</td>
                <td className="py-2 pl-1 pr-1 truncate max-w-[40mm]">
                  {item.product.name}
                </td>
                <td className="py-2 text-right align-top">
                  {new Intl.NumberFormat('vi-VN').format((item.product.price || 0) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="flex justify-between font-bold text-sm border-t border-black pt-2 mb-4">
          <span>TỔNG CỘNG:</span>
          <span>{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
        </div>
        
        <p className="text-center mt-6 text-[10px] italic">Cảm ơn quý khách và hẹn gặp lại!</p>
        <p className="text-center text-[10px] italic">--------------------------------</p>
      </div>
    </div>
  );
}
