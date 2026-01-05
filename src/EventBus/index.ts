import { EventEmitter } from 'events';

const emitter = new EventEmitter();

/**
 * Global event bus used to broadcast WebSocket messages and errors.
 * Subscribers can listen to 'message' and other events across modules.
 */
export default emitter;
