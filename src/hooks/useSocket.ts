import { useEffect, useState, useCallback } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                setSocket(ws);
            };

            ws.onclose = () => {
                setSocket(null);
                // Try to reconnect after 2 seconds
                setTimeout(connect, 2000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch (err) {
            console.error('WebSocket connection error:', err);
            // Try to reconnect after 2 seconds
            setTimeout(connect, 2000);
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [connect]);

    return socket;
};