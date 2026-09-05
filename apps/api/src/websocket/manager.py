import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("interviewai.websocket")

class ConnectionManager:
    def __init__(self):
        # Map session_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info("Client connected to session %s (total: %d)", 
                    session_id, len(self.active_connections[session_id]))

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.info("Client disconnected from session %s", session_id)

    async def broadcast(self, session_id: str, message: Dict[str, Any]):
        """Broadcasts a JSON event to all clients in this session."""
        if session_id not in self.active_connections:
            return

        dead_connections = []
        for connection in self.active_connections[session_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.warning("Error broadcasting to connection in %s: %s", session_id, e)
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead, session_id)

    async def send_status(self, session_id: str, status_text: str):
        """Sends an AI status signal: 'Listening...', 'Transcribing...', 'Analyzing...', 'Ready'"""
        await self.broadcast(session_id, {
            "type": "ai_status",
            "status": status_text
        })

    async def send_transcript(self, session_id: str, speaker: str, content: str, is_final: bool = True):
        await self.broadcast(session_id, {
            "type": "transcript",
            "speaker": speaker,
            "content": content,
            "is_final": is_final
        })

    async def send_evaluation(self, session_id: str, evaluation_data: Dict[str, Any]):
        await self.broadcast(session_id, {
            "type": "evaluation",
            "data": evaluation_data
        })

ws_manager = ConnectionManager()
