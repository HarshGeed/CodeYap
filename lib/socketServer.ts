// Server-side socket event emitter
// This makes HTTP requests to the socket server to trigger events

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 
                         (process.env.NODE_ENV === 'production' 
                           ? "https://your-socket-server.onrender.com"
                           : "http://localhost:3001");

export const emitSocketEvent = async (eventName: string, data: Record<string, unknown>) => {
  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/emit-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        data: data
      })
    });

    if (!response.ok) {
      console.error(`Failed to emit socket event ${eventName}:`, response.statusText);
    } else {
      console.log(`Successfully emitted socket event: ${eventName}`);
    }
  } catch (error) {
    console.error(`Error emitting socket event ${eventName}:`, error);
  }
};
