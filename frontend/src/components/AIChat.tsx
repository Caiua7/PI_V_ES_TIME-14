import React, { useState, useRef, useEffect } from 'react';

// Tipagem das mensagens
interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', content: 'Olá! Sou a IA de Pricing. Como posso ajudar com seus dados hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Adiciona a mensagem do usuário na tela
    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Chama a API do seu Backend Python (FastAPI)
      const response = await fetch('http://localhost:8000/api/v1/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.content }),
      });

      if (!response.ok) throw new Error('Falha na resposta do servidor');

      const data = await response.json();

      // 3. Adiciona a resposta do Gemini na tela
      const aiMsg: Message = { id: Date.now() + 1, role: 'ai', content: data.answer };
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        role: 'ai', 
        content: 'Ops! Tive um problema de conexão com o servidor de inteligência. Tente novamente.' 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botão Flutuante Principal */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
        >
          {/* Ícone de Cérebro/IA Simples feito em SVG */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header do Chat */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="font-bold flex items-center gap-2">
              <span>⚡</span> IA Pricing Insights
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 text-xl font-bold">
              ×
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`max-w-[80%] rounded-xl p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white self-end rounded-tr-none' 
                  : 'bg-gray-200 text-gray-800 self-start rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-200 text-gray-500 text-sm max-w-[80%] self-start p-3 rounded-xl rounded-tl-none animate-pulse">
                Analisando dados...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Texto */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre as margens..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Env
            </button>
          </div>
        </div>
      )}
    </div>
  );
}