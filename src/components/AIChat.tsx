'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
    const { transactions, subscriptions, accounts, getNetWorth, getMonthlySpend } = useFinance();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! 👋 Soy tu asistente financiero personal. Puedo ayudarte a analizar tus gastos, darte recomendaciones de ahorro, o responder cualquier pregunta sobre tus finanzas. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const buildFinancialContext = () => {
        const netWorth = getNetWorth();
        const monthlySpend = getMonthlySpend();

        // Get recent transactions (last 10)
        const recentTransactions = [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map(tx => ({
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                note: tx.note
            }));

        // Get active subscriptions
        const activeSubscriptions = subscriptions
            .filter(sub => sub.isActive)
            .map(sub => ({
                name: sub.name,
                amount: sub.amount,
                frequency: sub.frequency,
                type: sub.subscriptionType
            }));

        // Get account summary
        const accountSummary = accounts.map(acc => ({
            name: acc.name,
            type: acc.type,
            balance: acc.balance
        }));

        return {
            netWorth,
            monthlySpend,
            recentTransactions,
            activeSubscriptions,
            accountSummary,
            totalAccounts: accounts.length,
            totalSubscriptions: subscriptions.length
        };
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const financialContext = buildFinancialContext();

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    financialContext
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="chat-overlay" onClick={onClose}>
            <div className="chat-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    <div className="header-content">
                        <div className="ai-icon">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3>FinTrack AI</h3>
                            <p className="status">Asistente Financiero</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Messages */}
                <div className="messages-container">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            {msg.role === 'assistant' && (
                                <div className="message-avatar">
                                    <Sparkles size={16} />
                                </div>
                            )}
                            <div className="message-content">
                                <p>{msg.content}</p>
                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-avatar">
                                <Loader2 size={16} className="spinning" />
                            </div>
                            <div className="message-content">
                                <p className="typing">Pensando...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chat-input-container">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Pregúntame sobre tus finanzas..."
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            <style jsx>{`
        .chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .chat-container {
          background: var(--color-surface, white);
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          height: 80vh;
          max-height: 700px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
          padding: 20px;
          border-bottom: 1px solid var(--color-border, #E5E5EA);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .status {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          display: flex;
          gap: 12px;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 75%;
          background: var(--color-bg, #F2F2F7);
          padding: 12px 16px;
          border-radius: 16px;
          position: relative;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message-content p {
          margin: 0;
          font-size: 15px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-time {
          font-size: 11px;
          color: var(--color-text-muted, #8E8E93);
          margin-top: 4px;
          display: block;
        }

        .message.user .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .typing {
          font-style: italic;
          opacity: 0.7;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .chat-input-container {
          padding: 16px;
          border-top: 1px solid var(--color-border, #E5E5EA);
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        textarea {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--color-border, #E5E5EA);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          resize: none;
          max-height: 100px;
          background: var(--color-surface, white);
          color: var(--color-text, #000);
          outline: none;
        }

        textarea:focus {
          border-color: #667eea;
        }

        textarea:disabled {
          opacity: 0.5;
        }

        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
