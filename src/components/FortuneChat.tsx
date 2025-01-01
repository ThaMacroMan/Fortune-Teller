import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@meshsdk/react';

interface ChatMessage {
  role: 'user' | 'fortune-teller';
  content: string;
}

export default function FortuneChat() {
  const { connected } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (connected) {
      startInitialConversation();
    } else {
      setMessages([]);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }
  }, [connected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startInitialConversation = async () => {
    setMessages([]);
    setIsLoading(true);

    try {
      // Create empty fortune teller message
      setMessages([{ role: 'fortune-teller', content: '' }]);

      // Create new EventSource for streaming initial greeting
      const eventSource = new EventSource('/api/fortune?question=Give a mystical greeting and ask what aspect of their destiny they wish to explore: love, career, or spiritual growth');
      eventSourceRef.current = eventSource;
      let currentMessage = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.done) {
            // Update final message with complete response
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = data.content;
              return newMessages;
            });
            eventSource.close();
            setIsLoading(false);
            return;
          }

          if (data.content) {
            currentMessage += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = currentMessage;
              return newMessages;
            });
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
          eventSource.close();
          setIsLoading(false);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = 
              e instanceof Error ? e.message : "The spirits are confused...";
            return newMessages;
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setIsLoading(false);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = 
            "The connection to the spirit realm was lost...";
          return newMessages;
        });
      };
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([{
        role: 'fortune-teller',
        content: error instanceof Error 
          ? error.message 
          : "The spirits are disturbed... I cannot see clearly at this moment."
      }]);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create empty fortune teller message
      setMessages(prev => [...prev, { role: 'fortune-teller', content: '' }]);

      // Create new EventSource for streaming
      const eventSource = new EventSource(`/api/fortune?question=${encodeURIComponent(input)}`);
      eventSourceRef.current = eventSource;
      let currentMessage = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.done) {
            // Update final message with complete response
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = data.content;
              return newMessages;
            });

            // Add lucky numbers as a new message
            if (data.luckyNumbers) {
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  role: 'fortune-teller',
                  content: `Your lucky numbers for this reading are: ${data.luckyNumbers.join(', ')}`
                }]);
              }, 1000);
            }

            eventSource.close();
            setIsLoading(false);
            return;
          }

          if (data.content) {
            currentMessage += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = currentMessage;
              return newMessages;
            });
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
          eventSource.close();
          setIsLoading(false);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = 
              e instanceof Error ? e.message : "The spirits are confused...";
            return newMessages;
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        setIsLoading(false);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = 
            "The connection to the spirit realm was lost...";
          return newMessages;
        });
      };

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'fortune-teller',
        content: error instanceof Error 
          ? error.message 
          : "The spirits are disturbed... I cannot see clearly at this moment."
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-lg">
      {/* Messages Area */}
      <div className="space-y-4 h-96 overflow-y-auto mb-4 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-indigo-600/50 backdrop-blur-sm text-white'
              } transition-all duration-300 animate-fadeIn`}
            >
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-600/50 backdrop-blur-sm text-white p-3 rounded-lg animate-pulse">
              Reading the mystic energies...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the mystic about your future..."
          className="flex-1 p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          Ask
        </button>
      </form>
    </div>
  );
} 