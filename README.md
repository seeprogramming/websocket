# Real-Time Chat Application - Multi-Hop WebSocket Gateway Demo

This repository demonstrates a multi-hop, real-time message routing architecture using three separate applications connected via WebSockets.

## Architecture & Message Flow

The application implements the following message routing pathway:

```
[ Browser UI ]
      │
      │ (React State & JSX)
      ▼
[ React Application ]
      │
      │ ws://localhost:5001  (Native WebSocket)
      ▼
[ Node.js Gateway ]
      │
      │ ws://localhost:8000/ws (ws WebSocket library client)
      ▼
[ Python FastAPI Service ]
```

### End-to-End Flow Example

When a user types `"hi"` in the chat UI and clicks **Send**:

1. **React Application**
   - Renders the user's message `"hi"` in the chat bubble list immediately.
   - Triggers the visual "typing" indicator in the message list.
   - Sends the JSON payload `{"message": "hi"}` over a WebSocket connection to `ws://localhost:5001`.

2. **Node.js WebSocket Gateway**
   - Listens on port `5001`.
   - Receives connection from React, establishing client-specific mapping.
   - Immediately connects to Python service at `ws://localhost:8000/ws` for this client session.
   - Receives `{"message": "hi"}` from React client.
   - Forwards the exact payload `{"message": "hi"}` to the Python FastAPI service.
   - **Console logs printed:**
     - `React connected`
     - `Message received from React`
     - `Forwarding to Python`

3. **Python FastAPI Service**
   - Listens on port `8000`.
   - Accepts connection from the Node.js Gateway.
   - Receives `{"message": "hi"}`.
   - Triggers a 1-second artificial delay (`await asyncio.sleep(1)`).
   - Prepares and sends back the JSON response: `{"reply": "Hello, this response is coming from Python FastAPI"}`.
   - **Console logs printed:**
     - `Node connected`
     - `Received message`
     - `Sending response`

4. **Node.js WebSocket Gateway (Return Path)**
   - Receives the JSON response `{"reply": "..."}` from the Python service.
   - Forwards the exact response back to the paired React client.
   - **Console logs printed:**
     - `Response received from Python`
     - `Sending response to React`

5. **React Application (Return Path)**
   - Receives `{"reply": "Hello, this response is coming from Python FastAPI"}`.
   - Hides the "typing" indicator.
   - Renders the bot's response in a new bubble in the chat view.

---

## Directory Structure

```
chat-demo/
 ├── README.md               # Architecture documentation and startup instructions
 ├── frontend-react/         # React UI application (Vite-scaffolded, standard CSS)
 │    ├── package.json
 │    ├── src/
 │    │    ├── App.jsx       # Chat window UI and native WebSocket client
 │    │    ├── index.css     # Dark-themed glassmorphic design system
 │    │    └── main.jsx
 ├── node-gateway/           # Node.js Express + ws gateway routing server
 │    ├── package.json
 │    └── server.js          # Gateway entry point and WebSocket bridge logic
 └── python-service/         # Python FastAPI WebSocket mock microservice
      ├── requirements.txt
      └── main.py            # FastAPI WebSocket route and handler
```

---

## Run Instructions

To run the full flow, you need three terminal windows open (one for each service). Start them in the following order:

### 1. Python FastAPI Service

First, navigate to the `python-service` directory, install requirements, and run the service using Uvicorn.

```bash
cd python-service
# Recommended: Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI service on Port 8000
uvicorn main:app --reload --port 8000
```

### 2. Node.js WebSocket Gateway

Next, navigate to the `node-gateway` directory, install dependencies, and start the node gateway.

```bash
cd node-gateway

# Install dependencies
npm install

# Start the gateway on Port 5001
node server.js
```

### 3. Frontend React Application

Finally, navigate to the `frontend-react` directory, install dependencies, and start the Vite development server.

```bash
cd frontend-react

# Install dependencies
npm install

# Start the Vite development server (usually runs on Port 5173)
npm run dev
```

Open your browser to the local development URL provided by Vite (e.g. `http://localhost:5173`) and send a message!
