'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export default function Chatbot() {
  const { getMonthlySpend, getNetWorth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', text: 'Hola, soy tu asistente financiero. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // TODO: Get real user ID from auth context
      const userId = 'user-uuid-placeholder'; // Reemplazar con ID real cuando tengamos Auth

      // Call Gemini Service
      const { chatWithGemini } = await import('@/services/geminiService');
      const responseText = await chatWithGemini(userMsg.text, userId);

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: "Lo siento, hubo un error al conectar con el asistente." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          <Bot size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <Bot size={20} />
              <span>FinTrack AI</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-fab {
          position: fixed;
          bottom: 100px; /* Above bottom nav, left side? Or right side above FAB? */
          right: 20px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-surface);
          color: var(--color-primary);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 80;
          border: 1px solid var(--color-border);
        }

        .chat-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          left: 20px;
          height: 400px;
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          z-index: 200;
          border: 1px solid var(--color-border);
          animation: slideUp 0.3s ease-out;
        }

        .chat-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--color-surface-hover);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .message {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .message.user {
          align-self: flex-end;
          background-color: var(--color-primary);
          color: white;
          border-bottom-right-radius: 2px;
        }

        .message.bot {
          align-self: flex-start;
          background-color: var(--color-bg);
          color: var(--color-text);
          border-bottom-left-radius: 2px;
          border: 1px solid var(--color-border);
        }

        .typing span {
          animation: blink 1.4s infinite both;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }

        .chat-input {
          padding: var(--spacing-sm);
          border-top: 1px solid var(--color-border);
          display: flex;
          gap: 8px;
        }

        .chat-input input {
          flex: 1;
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          padding: 8px 12px;
          border-radius: var(--radius-full);
          color: var(--color-text);
          outline: none;
        }

        .chat-input button {
          color: var(--color-primary);
          padding: 8px;
        }
        
        .chat-input button:disabled {
          color: var(--color-text-muted);
        }
      `}</style>
    </>
  );
}
