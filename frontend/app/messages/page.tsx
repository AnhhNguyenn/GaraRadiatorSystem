'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, CheckCheck, MoreVertical, Image as ImageIcon, Smile, Paperclip, Check, ChevronLeft, Store, User } from 'lucide-react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'customer';
  time: string;
}

interface ChatSession {
  id: string;
  customerName: string;
  platform: 'shopee' | 'tiktok' | 'offline';
  lastMessage: string;
  time: string;
  unread: number;
}

const mockSessions: ChatSession[] = [
  { id: '1', customerName: 'Quốc Hùng Auto', platform: 'shopee', lastMessage: 'Shop ơi két nước Vios còn không?', time: '10:23', unread: 2 },
  { id: '2', customerName: 'Phụ tùng Đại Phát', platform: 'tiktok', lastMessage: 'Giao hỏa tốc giúp mình nhé', time: 'Hôm qua', unread: 0 },
  { id: '3', customerName: 'Gara Tiến Phát', platform: 'offline', lastMessage: 'Cám ơn em rảnh chị ghé lấy', time: 'Hôm qua', unread: 0 },
];

export default function MessagesPage() {
  const [sessions] = useState<ChatSession[]>(mockSessions);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(mockSessions[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Shop ơi két nước Vios 2018 bản G còn hàng không ạ?', sender: 'customer', time: '10:20' },
    { id: '2', text: 'Chào anh, mã két nước Vios 2018 bên em hiện còn sẵn 12 cái ở kho A nhé. Anh đặt liền để cửa hàng đóng gói đi chiều nay cho kịp ạ!', sender: 'me', time: '10:22' },
    { id: '3', text: 'Shop ơi két nước Vios còn không?', sender: 'customer', time: '10:23' },
  ]);
  const [inputText, setInputText] = useState('');
  const [connection, setConnection] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const connectSignalR = async () => {
      try {
        const conn = new HubConnectionBuilder()
          .withUrl("http://localhost:7196/chathub")
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        conn.on("ReceiveMessage", (user, message) => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: message,
            sender: user === 'me' ? 'me' : 'customer',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        });
        
        await conn.start();
        setConnection(conn);
      } catch (e) {
        console.error('SignalR Connection Failed: ', e);
      }
    };
    
    connectSignalR();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setMessages([...messages, newMsg]);
    setInputText('');
    
    if (connection) {
      try {
        await connection.invoke("ReplyToCustomer", activeSession?.platform, activeSession?.id, inputText);
      } catch (e) {
        console.error("Lỗi khi gửi Hub Msg:", e);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex ios-card p-0 overflow-hidden bg-slate-50/30 border-none shadow-2xl">
      {/* Sidebar: Chat List */}
      <div className="w-80 flex flex-col border-r border-slate-100 bg-white/50 backdrop-blur-md">
        <div className="p-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Hội thoại</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100/50 border-none focus:ring-4 focus:ring-primary/10 outline-none text-sm font-bold placeholder:font-normal transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={cn(
                "p-4 rounded-3xl cursor-pointer transition-all duration-300 relative group",
                activeSession?.id === session.id 
                  ? 'bg-white shadow-lg shadow-slate-200/50 border-slate-50' 
                  : 'hover:bg-white/40'
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-slate-900 line-clamp-1">{session.customerName}</span>
                <span className="text-[10px] uppercase font-black text-slate-300 min-w-max ml-2 italic">{session.time}</span>
              </div>
              <p className={cn(
                "text-xs line-clamp-1 pr-6",
                session.unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
              )}>
                {session.lastMessage}
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <div className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm",
                  session.platform === 'shopee' ? 'bg-[#f97316]' : session.platform === 'tiktok' ? 'bg-black' : 'bg-slate-400'
                )}>
                  {session.platform}
                </div>
                {session.unread > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-primary/20 animate-pulse">
                    {session.unread}
                  </span>
                )}
              </div>
              {activeSession?.id === session.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main: Chat View */}
      {activeSession ? (
        <div className="flex-1 flex flex-col bg-slate-50 relative">
          {/* Header */}
          <div className="h-20 px-8 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 shadow-inner">
                {activeSession.platform === 'shopee' ? <Store className="h-6 w-6 text-[#f97316]" /> : <User className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-lg tracking-tight">{activeSession.customerName}</h2>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang trực tuyến</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-2xl text-slate-400 hover:text-slate-900">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div key={msg.id} className={cn("flex group", isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[80%] px-5 py-3.5 shadow-2xl transition-all duration-300",
                    isMe 
                      ? 'bg-primary text-white rounded-[2rem] rounded-tr-none shadow-primary/10' 
                      : 'bg-white text-slate-900 rounded-[2rem] rounded-tl-none shadow-slate-200'
                  )}>
                    <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
                    <div className={cn(
                      "text-[9px] font-black mt-2 flex items-center gap-1 uppercase tracking-tight opacity-70",
                      isMe ? 'justify-end' : 'justify-start'
                    )}>
                      {msg.time}
                      {isMe && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white shrink-0 border-t border-slate-100">
            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-2 flex items-end gap-2 group-focus-within:bg-white group-focus-within:border-primary/20 transition-all">
              <Button variant="ghost" size="icon" className="text-slate-400 rounded-2xl hover:bg-white shrink-0">
                <ImageIcon className="h-5 w-5" />
              </Button>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nhập phản hồi dành cho khách hàng... (Enter để gửi)"
                className="flex-1 bg-transparent border-none outline-none resize-none px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal min-h-[44px] max-h-32 scrollbar-hide"
                rows={1}
              />
              <Button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="h-11 w-11 rounded-2xl bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all shrink-0 p-0"
              >
                <Send className="h-5 w-5 ml-1" />
              </Button>
            </div>
            <div className="mt-3 flex gap-4 px-2">
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> Chèn tệp tin
              </button>
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                <Smile className="h-3 w-3" /> Biểu tượng
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 italic font-medium">
           <div className="p-8 rounded-full bg-slate-100/50 mb-4">
              <Search className="h-12 w-12 opacity-10" />
           </div>
           <p>Vui lòng chọn khách hàng để bắt đầu tư vấn kỹ thuật</p>
        </div>
      )}
    </div>
  );
}
