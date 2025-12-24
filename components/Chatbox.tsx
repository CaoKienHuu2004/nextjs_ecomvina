"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
};

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", text: "Xin chào! Tôi là trợ lý ảo Siêu Thị Vina. Tôi có thể giúp gì cho bạn?" }
  ]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API = process.env.NEXT_PUBLIC_SERVER_API || "https://sieuthivina.com";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input;
    const newMsgUser: Message = { id: Date.now(), role: "user", text: userMsgText };
    
    setMessages((prev) => [...prev, newMsgUser]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ message: userMsgText }),
      });

      const data = await res.json();
      const replyText = data.reply || "Xin lỗi, tôi không hiểu ý bạn.";
      
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: replyText }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev, 
        { id: Date.now() + 1, role: "ai", text: "Lỗi kết nối server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Dùng style inline để đảm bảo vị trí Fixed (Nổi) hoạt động 100%
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      zIndex: 99999, // Luôn nổi trên cùng
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      fontFamily: 'var(--body-font, sans-serif)'
    }}>
      
      {/* --- CỬA SỔ CHAT --- */}
      {isOpen && (
        <div style={{
          width: '350px',
          height: '480px',
          marginBottom: '15px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
          border: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div className="bg-main-600" style={{ padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph-fill ph-robot" style={{ fontSize: '20px' }}></i>
              </div>
              <span style={{ fontWeight: 600 }}>Trợ lý AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <i className="ph-bold ph-x" style={{ fontSize: '18px' }}></i>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', backgroundColor: '#f9f9f9' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  borderBottomRightRadius: msg.role === 'user' ? '0' : '12px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '0' : '12px',
                  // Dùng class màu của theme bạn, hoặc fallback màu cứng
                  backgroundColor: msg.role === 'user' ? '#D13627' : '#fff', // Màu cam đỏ theme Vina hoặc trắng
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'ai' ? '1px solid #e0e0e0' : 'none'
                }} className={msg.role === 'user' ? 'bg-main-600' : ''}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                <div style={{ padding: '10px', background: '#e0e0e0', borderRadius: '10px', fontSize: '12px', color: '#666' }}>
                  Đang soạn tin...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '8px', backgroundColor: '#fff' }}>
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #ddd',
                borderRadius: '20px',
                padding: '8px 15px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-main-600"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (loading || !input.trim()) ? 0.6 : 1
              }}
            >
              <i className="ph-fill ph-paper-plane-right" style={{ fontSize: '18px' }}></i>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-main-600 hover-bg-main-800"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 15px rgba(209, 54, 39, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? (
          <i className="ph-bold ph-caret-down" style={{ fontSize: '24px' }}></i>
        ) : (
          <i className="ph-fill ph-chat-circle-dots" style={{ fontSize: '32px' }}></i>
        )}
      </button>
    </div>
  );
}