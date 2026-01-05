import { WebSocket } from 'ws';
import emitter from '../EventBus';

interface Options {
    edgeRollout: string | '60';
    authorization: string;
}

let websocket : WebSocket;
let savedOptions: Options;
let reconnectAttempts = 0;

/**
 * Establishes (or reuses) a WebSocket connection to Character.AI.
 * Emits incoming messages through the global EventBus for subscribers.
 * Handles reconnection attempts on unexpected close events.
 * @param options - Initial connection options containing auth and rollout.
 * @returns Resolves when the socket is open and ready.
 */
export const connect = async (options?: Options) : Promise<void> => {
    await new Promise((resolve, reject) => {
        if (options) savedOptions = options;
        if (!savedOptions && !options) return reject(new Error("Options required for initial connection"));
        
        const opts = options || savedOptions;

        if (websocket && websocket.readyState === WebSocket.OPEN) return resolve(websocket);
        
        websocket = new WebSocket('wss://neo.character.ai/ws/', {
            headers: {
                cookie: `HTTP_AUTHORIZATION="Token ${opts.authorization}"; edge_rollout=${opts.edgeRollout};`,
                "Origin": "https://character.ai",
                "Referer": "https://character.ai/"
            }
        });

        websocket.on('message', data => {
            emitter.emit('message', data);
        });
    
        websocket.once('open', () => {
            console.log('Character AI connected');
            reconnectAttempts = 0;
            resolve(websocket);
        });
    
        websocket.on('error', e => {
            console.log('Character AI error:', e);
            if (options) reject(e); 
        });

        websocket.on('close', (code, reason) => {
            console.log(`Character AI disconnected (Code: ${code}, Reason: ${reason})`);
            
            if (reconnectAttempts >= 5) {
                console.log('Max reconnection attempts (5) reached. Giving up.');
                return;
            }

            reconnectAttempts++;
            console.log(`Attempting to reconnect in 5 seconds... (Attempt ${reconnectAttempts}/5)`);
            setTimeout(() => {
                connect().catch(e => console.error("Reconnection failed:", e));
            }, 5000);
        });
    });
}

/**
 * Returns the current WebSocket instance.
 * @returns Active WebSocket or undefined if not connected.
 */
export const getSocket = () : WebSocket => {
    return websocket;
}
