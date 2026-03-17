'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, CheckDouble, MoreVertical, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

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

        conn.on("SystemMessage", (msg) => {
          console.log("System:", msg);
        });

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
    
    // Auto connect
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
    
    // Gửi realtime qua SignalR Hub
    if (connection) {
      try {
        await connection.invoke("ReplyToCustomer", activeSession?.platform, activeSession?.id, inputText);
      } catch (e) {
        console.error("Lỗi khi gửi Hub Msg:", e);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar: Chat List */}
      <div className="w-80 flex flex-col border-r border-slate-200 bg-slate-50/50">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors ${activeSession?.id === session.id ? 'bg-white border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-900 line-clamp-1">{session.customerName}</span>
                <span className="text-xs text-slate-400 min-w-max ml-2">{session.time}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className={`line-clamp-1 mr-2 ${session.unread > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                  {session.lastMessage}
                </span>
                {session.unread > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {session.unread}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white ${session.platform === 'shopee' ? 'bg-[#f97316]' : session.platform === 'tiktok' ? 'bg-black' : 'bg-slate-400'}`}>
                  {session.platform}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Chat View */}
      {activeSession ? (
        <div className="flex-1 flex flex-col bg-[#e5ddd5] relative">
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-500">
                {activeSession.customerName.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{activeSession.customerName}</h2>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trực tuyến trên {activeSession.platform}
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-emerald-700 justify-end' : 'text-slate-400'}`}>
                      {msg.time}
                      {isMe && <CheckDouble className="h-4 w-4 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-100 flex items-end gap-2 shrink-0">
            <button className="p-3 text-slate-500 hover:text-slate-700 transition-colors shrink-0">
              <Smile className="h-6 w-6" />
            </button>
            <button className="p-3 text-slate-500 hover:text-slate-700 transition-colors shrink-0">
              <Paperclip className="h-6 w-6" />
            </button>
            
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Soạn tin nhắn (Enter để gửi)..."
              className="flex-1 bg-white rounded-xl border border-slate-200 outline-none resize-none px-4 py-3 text-[15px] text-slate-900 focus:ring-1 focus:ring-indigo-300 min-h-[48px] max-h-32"
              rows={1}
            />
            
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-3 text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition-colors shrink-0 rounded-full hover:bg-emerald-50"
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
          <MoreVertical className="h-16 w-16 mb-4 opacity-20" />
          <p>Chọn một cuộc trò chuyện từ danh sách</p>
        </div>
      )}
    </div>
  );
}
