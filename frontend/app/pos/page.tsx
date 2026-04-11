'use client';

import { Product } from "@/types/product";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ShoppingCart, Printer, CreditCard, User, Package } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: 'Khách lẻ', phone: '' });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data?.data || data || []);
    } catch (e) {
      console.error(e);
    }
  };

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

  const addToCart = (product: Product) => {
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
          unitPrice: item.product.retailPrice || 0
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

  // ⚡ Bolt Optimization: Memoize the total amount calculation to prevent O(N) recalculations on every render.
  // Impact: O(1) during unrelated re-renders (like typing in search).
  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.product.retailPrice || 0) * item.quantity, 0), [cart]);

  // ⚡ Bolt Optimization: Memoize the filtered products list.
  // Impact: Prevents O(N) string matching operations on the entire product catalog when the cart updates.
  const filteredProducts = useMemo(() => products.filter(p =>
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [products, searchTerm]);

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 print:block print:h-auto pb-6">
      {/* Left: Products (Hidden on Print) */}
      <div className="flex-1 flex flex-col ios-card overflow-hidden print:hidden border border-slate-50">
        <div className="p-6 border-b border-slate-50 bg-white/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="F1: Tìm sản phẩm (Tên, Mã SKU)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Hệ thống sẵn sàng</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="text-left p-4 rounded-[2rem] border border-transparent hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group bg-white active:scale-95 duration-300"
              >
                <div className="h-32 bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center overflow-hidden group-hover:bg-primary/5 transition-colors">
                  <Package className="h-12 w-12 text-slate-200 group-hover:text-primary/40 group-hover:scale-110 transition-all duration-500" />
                </div>
                <div className="px-1">
                  <div className="font-extrabold text-slate-900 line-clamp-2 text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{p.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{p.sku}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-slate-900 tracking-tight">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.retailPrice || 0)}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-lg font-bold">
                      +
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart (Hidden on Print) */}
      <div className="w-[400px] flex flex-col ios-card overflow-hidden print:hidden border border-slate-50">
        <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            Giỏ hàng
          </h2>
          <span className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-primary/20">{cart.length} Nhóm</span>
        </div>

        <div className="p-6 bg-slate-50/50">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Khách hàng</label>
              <input 
                type="text" 
                value={customerInfo.name}
                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full border-none outline-none focus:ring-0 p-0 text-slate-900 font-bold bg-transparent placeholder:text-slate-300"
                placeholder="Nhập tên khách hàng..."
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-50/50">
                <ShoppingCart className="h-10 w-10 opacity-20" />
              </div>
              <p className="font-bold uppercase tracking-widest text-[11px]">Giỏ hàng đang trống</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                  <Package className="h-8 w-8 text-slate-300 group-hover:text-primary/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{item.product.name}</h4>
                  <div className="text-primary font-black text-sm tracking-tight">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product.retailPrice || 0)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-8">
                    <button 
                      onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                      className="px-3 text-slate-400 hover:text-primary font-black transition-colors"
                    >-</button>
                    <span className="w-6 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                    <button 
                      onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))}
                      className="px-3 text-slate-400 hover:text-primary font-black transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-900 text-white rounded-t-[2.5rem] shadow-2xl transition-all h-[220px]">
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tổng thanh toán</p>
              <h3 className="text-3xl font-black tracking-tighter">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
              </h3>
            </div>
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <button 
            id="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full h-16 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Printer className="h-6 w-6" />
            Thanh toán (F8)
          </button>
        </div>
      </div>

      {/* Print Overlay (Visible ONLY on print) */}
      <div className="hidden print:block w-[80mm] text-black text-[10px] font-sans mx-auto leading-tight">
        <h1 className="text-center font-black text-2xl mb-1 mt-4">GARAGE RADIATOR</h1>
        <p className="text-center text-xs font-black uppercase tracking-[0.2em] mb-6">Hóa đơn bán hàng</p>
        
        <div className="border-t-[1.5px] border-b-[1.5px] border-black py-3 mb-6 space-y-1">
          <div className="flex justify-between font-bold">
            <span>Khách hàng:</span>
            <span>{customerInfo.name}</span>
          </div>
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>Thời gian:</span>
            <span>{new Date().toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex justify-between text-[9px] text-slate-600">
            <span>Thu ngân:</span>
            <span>Admin</span>
          </div>
        </div>
        
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-100 text-[9px] font-black uppercase text-slate-400">
              <th className="text-left py-2">SL</th>
              <th className="text-left py-2 px-2">Sản phẩm</th>
              <th className="text-right py-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cart.map(item => (
              <tr key={item.product.id}>
                <td className="py-3 font-bold align-top">{item.quantity}</td>
                <td className="py-3 px-2 align-top">
                  <div className="font-bold">{item.product.name}</div>
                  <div className="text-[8px] text-slate-500 uppercase">{item.product.sku}</div>
                </td>
                <td className="py-3 text-right font-black align-top">
                  {new Intl.NumberFormat('vi-VN').format((item.product.retailPrice || 0) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="space-y-2 mb-10 pt-4 border-t-4 border-slate-50">
          <div className="flex justify-between text-xs font-black border-b-[1.5px] border-black pb-2">
            <span className="uppercase tracking-widest">Tổng thanh toán:</span>
            <span className="text-lg tracking-tighter">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
          </div>
        </div>
        
        <div className="text-center space-y-2 mt-10">
          <p className="font-bold uppercase tracking-widest text-[8px]">Cảm ơn quý khách và hẹn gặp lại!</p>
          <div className="flex justify-center gap-1">
            {[1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8].map(i => <span key={i} className="h-0.5 w-2 bg-slate-200" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
