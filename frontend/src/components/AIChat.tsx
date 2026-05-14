import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../services/apiClient';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
}

// Converte markdown simples para HTML
function parseMarkdown(text: string): string {
  return text
    // **negrito**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // *itálico*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Listas com -
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc pl-4 space-y-1">$1</ul>')
    // Quebras de linha
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', content: 'Olá! Sou a IA de Pricing. Como posso ajudar com seus dados hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await apiRequest<{ answer: string }>(
        '/api/v1/ai/insights',
        {
          method: 'POST',
          body: JSON.stringify({ question: userMsg.content }),
        }
      );

      const aiMsg: Message = { id: Date.now() + 1, role: 'ai', content: data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const rawMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const isNetworkError =
        rawMessage.toLowerCase().includes('failed to fetch') ||
        rawMessage.toLowerCase().includes('networkerror') ||
        rawMessage.toLowerCase().includes('network error');
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        content: isNetworkError
          ? 'Ops! Tive um problema de conexão com o servidor de inteligência. Tente novamente.'
          : `Ops! Não consegui gerar o insight agora. ${rawMessage}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 hover:opacity-90 flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          className="w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex justify-between items-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <div className="font-bold flex items-center gap-2">
              <span>⚡</span> IA Pricing Insights
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80 text-xl font-bold">
              ×
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div
                  key={msg.id}
                  className="max-w-[80%] rounded-xl p-3 text-sm text-white self-end rounded-tr-none"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {msg.content}
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="max-w-[80%] rounded-xl p-3 text-sm bg-white text-gray-800 self-start rounded-tl-none shadow-sm border border-gray-100"
                  dangerouslySetInnerHTML={{ __html: `<p>${parseMarkdown(msg.content)}</p>` }}
                />
              )
            )}
            {isLoading && (
              <div className="bg-gray-200 text-gray-500 text-sm max-w-[80%] self-start p-3 rounded-xl rounded-tl-none animate-pulse">
                Analisando dados...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre as margens..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Env
            </button>
          </div>
        </div>
      )}
    </div>
  );
}