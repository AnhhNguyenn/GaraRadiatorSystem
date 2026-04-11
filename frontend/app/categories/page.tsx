'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
import { ProductCategory } from '@/types/productCategory';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.products.categories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
    };
    try {
      await api.products.createCategory(data);
      setIsAddModalOpen(false);
      loadCategories();
      toast.success('Thêm danh mục thành công');
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Không thể tạo danh mục. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Danh mục sản phẩm</h1>
          <p className="text-sm font-medium text-slate-500">Quản lý và phân loại các sản phẩm trong hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="rounded-xl bg-primary shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <div className="ios-card overflow-hidden px-1">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              className="pl-11"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-50 hover:bg-transparent">
                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-wider py-4 px-6">ID</TableHead>
                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-wider py-4">Tên danh mục</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32 text-center text-slate-500 font-medium">Đang tải...</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32 text-center text-slate-500 font-medium">Chưa có danh mục nào.</TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                    <TableCell className="py-4 px-6 text-sm font-medium text-slate-500">{category.id.substring(0, 8)}...</TableCell>
                    <TableCell className="py-4 font-bold text-slate-900">{category.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm danh mục mới" maxWidth="max-w-md">
        <form className="space-y-6" onSubmit={handleCreateSubmit}>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên danh mục *</label>
            <Input name="name" required placeholder="VD: Két nước" />
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="rounded-xl bg-primary px-8">Lưu</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
