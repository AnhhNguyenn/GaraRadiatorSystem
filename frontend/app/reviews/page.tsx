'use client';

import { useState, useEffect } from 'react';
import { Star, MessageCircle, Reply, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.reviews.list();
      // Chèn mock data tạm nếu API rỗng cho MVP preview
      if (!data || data.length === 0) {
          setReviews([
              { id: '1', platform: 'Shopee', buyerName: 'Nguyễn Văn A', productName: 'Két nước Vios', rating: 5, comment: 'Hàng xịn, giao nhanh!', createdAt: new Date().toISOString() },
              { id: '2', platform: 'TikTok', buyerName: 'Gara Tiến Phát', productName: 'Quạt làm mát', rating: 1, comment: 'Hàng móp méo, shop xử lý chậm.', createdAt: new Date().toISOString() }
          ]);
      } else {
        setReviews(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Không thể lấy danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReview) return;
    const formData = new FormData(e.currentTarget);
    const replyText = formData.get('replyText') as string;

    try {
      if (selectedReview.id === '1' || selectedReview.id === '2') {
         // Mock update cho fake data
         setReviews(reviews.map(r => r.id === selectedReview.id ? {...r, reply: replyText, repliedAt: new Date().toISOString()} : r));
      } else {
         await api.reviews.reply(selectedReview.id, replyText);
         loadReviews();
      }
      toast.success('Đã phản hồi đánh giá thành công');
      setIsReplyModalOpen(false);
    } catch (e) {
      toast.error('Có lỗi xảy ra khi phản hồi');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đánh giá Sản phẩm</h1>
          <p className="text-sm font-medium text-slate-500">Quản lý và phản hồi đánh giá từ khách hàng trên mọi nền tảng.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
           Array.from({length:3}).map((_, idx) => (
             <div key={idx} className="ios-card p-6"><Skeleton className="h-20 w-full" /></div>
           ))
        ) : reviews.length === 0 ? (
           <div className="text-center text-slate-400 italic py-10">Chưa có đánh giá nào</div>
        ) : reviews.map((review) => (
           <div key={review.id} className="ios-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <div>
                    <h3 className="font-bold text-slate-900">{review.buyerName || 'Khách hàng'} <span className="text-xs text-slate-400 font-normal">đã đánh giá {review.productName}</span></h3>
                    <div className="flex items-center gap-1 mt-1">
                       {Array.from({length: 5}).map((_, i) => (
                         <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                       ))}
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="px-2 py-1 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-600">{review.platform}</span>
                 </div>
              </div>
              <p className="text-slate-700 italic text-sm">"{review.comment || 'Khách hàng không để lại nhận xét'}"</p>

              {review.reply ? (
                 <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mt-2">
                    <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Shop đã phản hồi:</p>
                    <p className="text-sm text-slate-800">{review.reply}</p>
                 </div>
              ) : (
                 <div className="flex justify-end mt-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={() => { setSelectedReview(review); setIsReplyModalOpen(true); }}>
                       <Reply className="mr-2 h-4 w-4" /> Phản hồi
                    </Button>
                 </div>
              )}
           </div>
        ))}
      </div>

      <Modal isOpen={isReplyModalOpen} onClose={() => setIsReplyModalOpen(false)} title="Phản hồi đánh giá">
        {selectedReview && (
           <form className="space-y-6" onSubmit={handleReplySubmit}>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
               <p className="text-sm italic text-slate-600">"{selectedReview.comment}"</p>
             </div>
             <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nội dung trả lời *</label>
               <textarea name="replyText" required className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Nhập nội dung phản hồi khách hàng..."></textarea>
             </div>
             <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-6">
                <Button variant="ghost" type="button" onClick={() => setIsReplyModalOpen(false)} className="rounded-xl">Hủy</Button>
                <Button type="submit" className="rounded-xl bg-primary px-8">Gửi phản hồi</Button>
             </div>
           </form>
        )}
      </Modal>
    </div>
  );
}
