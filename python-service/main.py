import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

# Set up simple logging to console
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("python-service")

app = FastAPI(title="Python WebSocket Service")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Accept the connection
    await websocket.accept()
    logger.info("Node connected")
    
    try:
        while True:
            # Receive data as JSON
            data = await websocket.receive_json()
            logger.info("Received message")
            
            # Artificial delay of 1 second as requested
            await asyncio.sleep(1)
            
            # Formulate response
            response = {
                "reply": "Hello, this response is coming from Python FastAPI"
            }
            
            # Send response back as JSON
            await websocket.send_json(response)
            logger.info("Sending response")
            
    except WebSocketDisconnect:
        logger.info("Node disconnected")
    except Exception as e:
        logger.error(f"Error in websocket connection: {e}")
