import { WebSocket } from 'ws';
import emitter from '../EventBus';
import { getProfile } from '../Auth';

interface Options {
    edgeRollout: string | '60';
    authorization: string;
}

let ws : WebSocket;
let wsGroup : WebSocket;
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
    const profile = getProfile();
    if (!profile) return Promise.reject(new Error("Profile not found"));
    await new Promise((resolve, reject) => {
        if (options) savedOptions = options;
        if (!savedOptions && !options) return reject(new Error("Options required for initial connection"));
        
        const opts = options || savedOptions;

        if (ws && ws.readyState === WebSocket.OPEN) return resolve(ws);
        
        ws = new WebSocket('wss://neo.character.ai/ws/', {
            headers: {
                cookie: `HTTP_AUTHORIZATION="Token ${opts.authorization}"; edge_rollout=${opts.edgeRollout};`,
                "Origin": "https://character.ai",
                "Referer": "https://character.ai/"
            }
        });

        ws.on('message', data => {
            if (data.toString('utf-8') === "{}") ws.send("{}")
            else emitter.emit('message', data);
        });
    
        ws.once('open', () => {
            ws.send(JSON.stringify({ connect: { name: "js" }, id: 1 }));
            ws.send(JSON.stringify({ subscribe: { channel: `user#${profile.user.id}` }, id: 2 }));
            console.log('Character AI connected');
            reconnectAttempts = 0;
            resolve(ws);
        });
    
        ws.on('error', e => {
            console.log('Character AI error:', e);
            if (options) reject(e); 
        });

        ws.on('close', (code, reason) => {
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
    return ws;
}

export const connectGroup = async (options?: Options) : Promise<void> => {
    const profile = getProfile();
    if (!profile) return Promise.reject(new Error("Profile not found"));
    await new Promise((resolve, reject) => {
        if (options) savedOptions = options;
        if (!savedOptions && !options) return reject(new Error("Options required for initial connection"));
        
        const opts = options || savedOptions;

        if (wsGroup && wsGroup.readyState === WebSocket.OPEN) return resolve(wsGroup);
        
        wsGroup = new WebSocket('wss://neo.character.ai/connection/websocket', {
            headers: {
                cookie: `HTTP_AUTHORIZATION="Token ${opts.authorization}"; edge_rollout=${opts.edgeRollout};`,
                "Origin": "https://character.ai",
                "Referer": "https://character.ai/"
            }
        });

        wsGroup.on('message', data => {
            if (data.toString('utf-8') === "{}") wsGroup.send("{}")
            else emitter.emit('message', data);
        });
    
        wsGroup.once('open', () => {
            wsGroup.send(JSON.stringify({ connect: { name: "js" }, id: 1 }));
            wsGroup.send(JSON.stringify({ subscribe: { channel: `user#${profile.user.id}` }, id: 2 }));
            console.log('Character AI Group connected');
            reconnectAttempts = 0;
            resolve(wsGroup);
        });
    
        wsGroup.on('error', e => {
            console.log('Character AI Group error:', e);
            if (options) reject(e); 
        });

        wsGroup.on('close', (code, reason) => {
            console.log(`Character AI Group disconnected (Code: ${code}, Reason: ${reason})`);
            
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
 * Returns the current WebSocket Group instance.
 * @returns Active WebSocket or undefined if not connected.
 */
export const getGroupSocket = () : WebSocket => {
    return wsGroup;
}
