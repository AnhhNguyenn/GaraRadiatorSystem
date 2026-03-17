'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Settings, Car, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Sản phẩm</h1>
          <p className="text-sm font-medium text-slate-500">Quản lý danh mục sản phẩm, thông số và dòng xe tương thích.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            size="sm"
            className="rounded-xl border-slate-200"
          >
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Lọc nâng cao
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="rounded-xl bg-primary shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="ios-card overflow-hidden px-1">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm tên sản phẩm, mã, dòng xe..."
              className="pl-11"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="h-11 w-full sm:w-auto rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="ket_nuoc">Két nước</SelectItem>
                <SelectItem value="nap_ket">Nắp két nước</SelectItem>
                <SelectItem value="ong_nuoc">Ống nước</SelectItem>
                <SelectItem value="quat">Quạt làm mát</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Mã SP</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Thông số</TableHead>
              <TableHead>Dòng xe</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-400 font-medium italic">
                  Đang tải dữ liệu hệ thống...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-400 font-medium italic">
                  Không tìm thấy sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="font-bold text-slate-400 text-xs">{product.sku || 'N/A'}</TableCell>
                  <TableCell className="font-extrabold text-slate-900">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-tight border-none">
                      {product.categoryName || 'Sản phẩm'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-slate-300" />
                      {product.brand || '---'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3 text-slate-300" />
                      ---
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "inline-flex items-center px-2 py-1 rounded-lg font-black",
                      (product.currentStock || 0) < 10 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {product.currentStock || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.retailPrice || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(product)} className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(product)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Hiển thị <span className="text-slate-900">{products.length}</span> kết quả
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled className="rounded-lg">Trước</Button>
            <Button variant="outline" size="xs" className="rounded-lg">Sau</Button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm sản phẩm mới" maxWidth="max-w-2xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên sản phẩm *</label>
              <Input required placeholder="VD: Két nước Toyota Vios 2015-2020" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mã sản phẩm (SKU) *</label>
              <Input required placeholder="VD: RAD-001" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục *</label>
              <Select required>
                <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ket_nuoc">Két nước</SelectItem>
                  <SelectItem value="nap_ket">Nắp két nước</SelectItem>
                  <SelectItem value="ong_nuoc">Ống nước</SelectItem>
                  <SelectItem value="quat">Quạt làm mát</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá bán lẻ (VNĐ) *</label>
              <Input type="number" required placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá sỉ / Gara (VNĐ)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Thông số kỹ thuật</label>
              <Input placeholder="VD: Dày 16mm, Nhôm, 2 hàng ống" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-primary px-8">Lưu sản phẩm</Button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Lọc sản phẩm">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái tồn kho</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="in-stock">Còn hàng</SelectItem>
                <SelectItem value="low">Sắp hết hàng (&lt; 5)</SelectItem>
                <SelectItem value="out">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Dòng xe</label>
            <Input placeholder="Nhập tên dòng xe..." />
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" onClick={() => setIsFilterModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={() => setIsFilterModalOpen(false)} className="rounded-xl bg-primary px-8">Áp dụng</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Sửa sản phẩm" maxWidth="max-w-2xl">
        {selectedProduct && (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsEditModalOpen(false); }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên sản phẩm *</label>
                <Input defaultValue={selectedProduct.name} required />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mã sản phẩm (SKU) *</label>
                <Input defaultValue={selectedProduct.sku} disabled className="bg-slate-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục *</label>
                <Select required defaultValue={selectedProduct.categoryName === 'Két nước' ? 'ket_nuoc' : selectedProduct.categoryName === 'Nắp két nước' ? 'nap_ket' : selectedProduct.categoryName === 'Ống nước' ? 'ong_nuoc' : 'quat'}>
                  <SelectTrigger className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ket_nuoc">Két nước</SelectItem>
                    <SelectItem value="nap_ket">Nắp két nước</SelectItem>
                    <SelectItem value="ong_nuoc">Ống nước</SelectItem>
                    <SelectItem value="quat">Quạt làm mát</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá bán lẻ (VNĐ) *</label>
                <Input defaultValue={selectedProduct.retailPrice} required />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tồn kho</label>
                <Input defaultValue={selectedProduct.currentStock} disabled className="bg-slate-50 font-bold" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
              <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Hủy</Button>
              <Button type="submit" className="rounded-xl bg-primary px-8">Lưu thay đổi</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa">
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <p className="text-sm font-medium text-rose-800">
              Bạn có chắc chắn muốn xóa sản phẩm <span className="font-black underline">{selectedProduct?.name}</span> không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-8">Xóa sản phẩm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
