const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 5001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (reactWs) => {
  console.log('React connected');

  // Connect to the Python FastAPI WebSocket service
  const pythonWsUrl = 'ws://127.0.0.1:8000/ws';
  const pythonWs = new WebSocket(pythonWsUrl);

  // Buffer messages from React if the Python connection isn't open yet
  const messageQueue = [];

  pythonWs.on('open', () => {
    // Flush buffered messages
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      console.log('Forwarding to Python (flushed from buffer)');
      pythonWs.send(msg);
    }
  });

  reactWs.on('message', (message) => {
    console.log('Message received from React');
    
    // We expect text (JSON string)
    const msgStr = message.toString();

    if (pythonWs.readyState === WebSocket.OPEN) {
      console.log('Forwarding to Python');
      pythonWs.send(msgStr);
    } else {
      // Buffer it if connection is still opening
      messageQueue.push(msgStr);
    }
  });

  pythonWs.on('message', (message) => {
    console.log('Response received from Python');
    
    const msgStr = message.toString();
    if (reactWs.readyState === WebSocket.OPEN) {
      console.log('Sending response to React');
      reactWs.send(msgStr);
    }
  });

  // Handle closing and errors to avoid crashing the server
  reactWs.on('close', () => {
    console.log('React connection closed');
    if (pythonWs.readyState === WebSocket.OPEN || pythonWs.readyState === WebSocket.CONNECTING) {
      pythonWs.close();
    }
  });

  pythonWs.on('close', () => {
    console.log('Python service connection closed');
    if (reactWs.readyState === WebSocket.OPEN || reactWs.readyState === WebSocket.CONNECTING) {
      reactWs.close();
    }
  });

  reactWs.on('error', (error) => {
    console.error('React WebSocket Error:', error);
  });

  pythonWs.on('error', (error) => {
    console.error('Python WebSocket Error:', error);
    // If Python service fails to connect, notify React and close
    if (reactWs.readyState === WebSocket.OPEN) {
      reactWs.send(JSON.stringify({ reply: "Error: Python service is unreachable." }));
      reactWs.close();
    }
  });
});

// Simple status endpoint for HTTP
app.get('/status', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

server.listen(port, () => {
  console.log(`Node Gateway is listening on port ${port}`);
});
