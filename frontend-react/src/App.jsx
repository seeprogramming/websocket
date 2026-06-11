import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'system',
      text: 'WebSocket connection initialized. Send a message to see the hop-by-hop flow in action!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [isTyping, setIsTyping] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Function to initialize WebSocket connection
  const connectWebSocket = () => {
    setConnectionStatus('connecting');
    
    // Clear any pending reconnects
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const ws = new WebSocket('ws://localhost:5001');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: 'system',
            text: 'Successfully connected to Node.js WebSocket Gateway.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      };

      ws.onmessage = (event) => {
        setIsTyping(false);
        try {
          const data = JSON.parse(event.data);
          
          if (data.reply) {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: data.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          } else {
            console.warn('Received message without reply payload:', data);
          }
        } catch (err) {
          console.error('Failed to parse incoming WebSocket message:', err);
          // Fallback if data is raw text
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: event.data,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: 'system',
            text: 'Connection to gateway closed. Retrying in 3 seconds...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        // Schedule reconnection
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws.close();
      };
      
    } catch (e) {
      console.error('WebSocket creation failed:', e);
      setConnectionStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        // Remove close handler to prevent triggering reconnect logic on unmount
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom of chat when messages change or typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Check if websocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Cannot send message: WebSocket is not connected.');
      return;
    }

    const currentText = inputText;
    
    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: currentText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    // Clear input box
    setInputText('');

    // Trigger typing state (wait response from python)
    setIsTyping(true);

    // Send payload: {"message": "..."}
    const payload = JSON.stringify({ message: currentText });
    wsRef.current.send(payload);
  };

  return (
    <div className="app-container">
      {/* Dynamic ambient background glowing circles */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      
      <main className="chat-window">
        {/* Chat header */}
        <header className="chat-header">
          <div className="header-info">
            <h1 className="header-title">Multi-Hop Chat Gateway</h1>
            <p className="header-subtitle">Architecture Demo: React ⇄ Node ⇄ FastAPI</p>
          </div>
          
          <div className={`status-badge ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
            </span>
          </div>
        </header>

        {/* Messaging Area */}
        <section className="message-area">
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                {msg.sender === 'system' ? (
                  <div className="system-message">
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="message-bubble-container">
                    <div className="bubble-sender-label">
                      {msg.sender === 'user' ? 'React Client (You)' : 'Python FastAPI (via Node)'}
                    </div>
                    <div className="message-bubble">
                      <p className="message-text">{msg.text}</p>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Animated Typing Indicator */}
            {isTyping && (
              <div className="message-wrapper bot">
                <div className="message-bubble-container">
                  <div className="bubble-sender-label">Python FastAPI (via Node)</div>
                  <div className="message-bubble typing-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Form Input Area */}
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            className="chat-input"
            placeholder={connectionStatus === 'connected' ? "Type a message..." : "Waiting for connection..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={connectionStatus !== 'connected'}
            maxLength={1000}
            autoFocus
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={connectionStatus !== 'connected' || !inputText.trim()}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" className="send-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="currentColor" />
            </svg>
          </button>
        </form>
        
        {/* Footer detailing the architecture flow */}
        <footer className="architecture-footer">
          <div className="flow-step react active">React (Client)</div>
          <div className={`flow-connector ${connectionStatus}`}>⇄</div>
          <div className={`flow-step node ${connectionStatus === 'connected' ? 'active' : ''}`}>Node Gateway (Port 5001)</div>
          <div className={`flow-connector ${connectionStatus}`}>⇄</div>
          <div className={`flow-step python ${connectionStatus === 'connected' && !isTyping ? 'active' : isTyping ? 'waiting' : ''}`}>FastAPI Python (Port 8000)</div>
        </footer>
      </main>
    </div>
  );
}

export default App;
