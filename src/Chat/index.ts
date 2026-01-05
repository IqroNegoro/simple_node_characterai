import emitter from "../EventBus";
import { getProfile } from "../Auth";
import { AddTurnResponse, CreateChatRequest, CreateAndGenerateTurnRequest, UpdateTurnResponse, Turn } from "../types/Chat";
import { getSocket } from "../Websocket";
import { v4 } from 'uuid';
import { request } from "../api";

/**
 * Creates a new one-on-one chat for the given character.
 * Opens a WebSocket request and resolves when the initial turn is added.
 * @param characterId - The ID of the character to start a chat with.
 * @returns AddTurnResponse containing chat metadata and the greeting turn.
 */
export const createNewConversation = async (characterId: string): Promise<AddTurnResponse> => {
    if (!characterId) throw Error('Character ID is required for creating new conversation');
    const websocket = getSocket();
    return new Promise((resolve, reject) => {
        const request_id = v4();
        const profile = getProfile();
        const request: CreateChatRequest = {
            command: "create_chat",
            request_id,
            payload: {
                chat: {
                    character_id: characterId,
                    creator_id: profile.user.id.toString(),
                    chat_id: request_id,
                    type: 'TYPE_ONE_ON_ONE',
                    visibility: 'VISIBILITY_PRIVATE'
                },
                chat_type: 'TYPE_ONE_ON_ONE',
                with_greeting: true,
            },
            origin_id: "web-next"
        };

        const messageHandler = (data: Buffer) => {
            try {
                const message = data.toString('utf-8');
                const response = JSON.parse(message);
                if (response.command === 'add_turn' && response.request_id === request_id) {
                    clearTimeout(timeout);
                    emitter.off('message', messageHandler);
                    resolve(response as AddTurnResponse);
                }
            } catch {}
        };

        emitter.on('message', messageHandler);
        const timeout = setTimeout(() => {
            emitter.off('message', messageHandler);
            reject(new Error('Timeout waiting for response'));
        }, 30000);
        websocket.send(JSON.stringify(request));
    });
};

/**
 * Sends a message to an existing chat and waits for the final reply.
 * Uses the WebSocket to create and generate a turn, resolving on final candidate.
 * @param message - The user's text message to send.
 * @param characterId - The target character's ID.
 * @param chatId - The ID of the chat where the message is posted.
 * @returns UpdateTurnResponse containing the generated turn with final candidate.
 */
export const sendMessage = async (message: string, characterId: string, chatId: string): Promise<UpdateTurnResponse> => {
    if (!message) throw Error('Message is required for sending message');
    if (!chatId) throw Error('Chat ID is required for sending message');
    if (!characterId) throw Error('Character ID is required for sending message');
    const websocket = getSocket();
    return new Promise((resolve, reject) => {
        console.log('sending message')
        const uuid = v4();
        const profile = getProfile();
        const request: CreateAndGenerateTurnRequest = {
            command: "create_and_generate_turn",
            request_id: uuid,
            payload: {
                chat_type: "TYPE_ONE_ON_ONE",
                num_candidates: 1,
                tts_enabled: false,
                selected_language: "",
                character_id: characterId,
                user_name: profile.user.username,
                turn: {
                    turn_key: {
                        turn_id: uuid,
                        chat_id: chatId
                    },
                    author: {
                        author_id: profile.user.id.toString(),
                        is_human: true,
                        name: profile.user.username
                    },
                    candidates: [
                        {
                            candidate_id: uuid,
                            raw_content: message
                        }
                    ],
                    primary_candidate_id: uuid
                },
                previous_annotations: {
                    boring: 0,
                    not_boring: 0,
                    inaccurate: 0,
                    not_inaccurate: 0,
                    repetitive: 0,
                    not_repetitive: 0,
                    out_of_character: 0,
                    not_out_of_character: 0,
                    bad_memory: 0,
                    not_bad_memory: 0,
                    long: 0,
                    not_long: 0,
                    short: 0,
                    not_short: 0,
                    ends_chat_early: 0,
                    not_ends_chat_early: 0,
                    funny: 0,
                    not_funny: 0,
                    interesting: 0,
                    not_interesting: 0,
                    helpful: 0,
                    not_helpful: 0
                },
                generate_comparison: false
            },
            origin_id: "web-next"
        };

        const messageHandler = (data: Buffer) => {
            try {
                const message = data.toString('utf-8');
                const response = JSON.parse(message) as UpdateTurnResponse;
                if (response.command === 'update_turn' && response.request_id === uuid && response.turn.candidates[0]?.is_final) {
                    clearTimeout(timeout);
                    emitter.off('message', messageHandler);
                    resolve(response);
                }
            } catch {}
        };

        emitter.on('message', messageHandler);
        const timeout = setTimeout(() => {
            emitter.off('message', messageHandler);
            reject(new Error('Timeout waiting for response'));
        }, 30000);
        websocket.send(JSON.stringify(request));
    });
};

/**
 * Retrieves up to 50 messages (turns) for a given chat.
 * If a `token` is provided, it fetches the next page of results.
 * @param chatId - The ID of the chat whose messages are to be fetched.
 * @param token - Optional pagination token for retrieving the next batch.
 * @return Parsed JSON containing up to 50 messages.
 */
export const getMessages = async (chatId: string, token?: string) : Promise<Turn[]> => {
    const query = token ? `?next_token=${encodeURIComponent(token)}` : '';
    const req = await request(`https://neo.character.ai/turns/${chatId}/${query}`, {
        method: 'GET',
        includeAuthorization: true
    });

    const result = await req.json();

    return result.turns;
}
