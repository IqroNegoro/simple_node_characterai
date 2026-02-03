import emitter from "../EventBus";
import { getProfile } from "../Auth";
import { AddTurnResponse, CreateChatRequest, CreateAndGenerateTurnRequest, UpdateTurnResponse, Turn, CreateGroupChatPayload, ConnectGroupChatResponse, ConnectGroupChatPayload, disconnectGroupChatPayload, GroupChat, MessageGroupPayload, MessageGroupResponse, MessageGroupGenerateTurnRequest, MessageGroupGenerateTurnResponse } from "../types/Chat";
import { getGroupSocket, getSocket } from "../Websocket";
import { v4 } from 'uuid';
import { request } from "../api";

/**
 * Creates a new one-on-one chat for the given character.
 * Opens a WebSocket request and resolves when the initial turn is added.
 * @param characterId - The ID of the character to start a chat with.
 * @returns {Promise<AddTurnResponse>} AddTurnResponse containing chat metadata and the greeting turn.
 */
export const createNewConversation = async (characterId: string): Promise<AddTurnResponse> => {
    try {
        if (!characterId) throw Error('Character ID is required for creating new conversation');
        const websocket = getSocket();
        return await new Promise((resolve, reject) => {
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
                origin_id: "Android"
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
    } catch (error) {
        throw Error(`Failed to create new conversation: ${error}`);
    }
};

/**
 * Retrieves up to 50 messages (turns) for a given chat.
 * If a `token` is provided, it fetches the next page of results.
 * Token can be null in the end of the chat.
 * @param chatId - The ID of the chat whose messages are to be fetched.
 * @param token - Optional pagination token for retrieving the next batch.
 * @returns {Promise<{turns: Turn[], meta: {next_token: string | null}}>} Parsed JSON containing up to 50 messages in turns field, and the token for pagination in meta field.
 */
export const getMessages = async (chatId: string, token?: string) : Promise<{
    turns: Turn[],
    meta: {
        next_token: string | null
    }
}> => {
    try {
        const query = token ? `?next_token=${encodeURIComponent(token)}` : '';
        const req = await request(`https://neo.character.ai/turns/${chatId}/${query}`, {
            method: 'GET',
            includeAuthorization: true
        });
    
        const result = await req.json();
    
        return result;
    } catch (error: unknown) {
        throw Error(`Failed to get messages, Error: ${error}`);
    }
}

/**
 * Sends a message to an existing chat and waits for the final reply.
 * Uses the WebSocket to create and generate a turn, resolving on final candidate.
 * @param message - The user's text message to send.
 * @param characterId - The target character's ID.
 * @param chatId - The ID of the chat where the message is posted.
 * @returns {Promise<UpdateTurnResponse>} UpdateTurnResponse containing the generated turn with final candidate.
 */
export const sendMessage = async (message: string, characterId: string, chatId: string): Promise<UpdateTurnResponse> => {
    try {
        if (!message) throw Error('Message is required for sending message');
        if (!chatId) throw Error('Chat ID is required for sending message');
        if (!characterId) throw Error('Character ID is required for sending message');
        const websocket = getSocket();
        return await new Promise((resolve, reject) => {
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
                origin_id: "Android"
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
    } catch (error) {
        throw Error(`Failed to send message: ${error}`);
    }
};

/**
 * Lists all group chats (rooms) the user is a member of.
 * @returns {Promise<{rooms: GroupChat[]}>} Promise resolving to an object containing an array of GroupChat rooms.
 */
export const listGroupChats = async () : Promise<{rooms: GroupChat[]}> => {
    try {
        const response = await request('https://neo.character.ai/murooms/?include_turns=false', {
            method: 'GET',
            includeAuthorization: true
        });
    
        const result = await response.json();
    
        return result;
    } catch (error: unknown) {
        throw Error(`Failed to list group chat, Error: ${error}`);
    }
}

/**
 * Creates a new group chat room with specified characters.
 * @param title - The title of the group chat room.
 * @param characters_id - A single character ID or an array of character IDs to include in the group.
 * @returns {Promise<GroupChat>} Promise resolving to the created GroupChat object.
 */
export const createGroupChat = async (title: string, characters_id: string | string[]) : Promise<GroupChat> => {
    try {
        const req = await request(`https://neo.character.ai/muroom/create`, {
            method: 'POST',
            includeAuthorization: true,
            contentType: 'application/json',
            body: JSON.stringify({
                "characters": Array.isArray(characters_id) ? characters_id : [characters_id],
                "title": title,
                "settings": {
                    "anyone_can_join": true,
                    "require_approval": false
                },
                "visibility": "VISIBILITY_UNLISTED",
                "with_greeting": true
            } as CreateGroupChatPayload)
        });

        const result = await req.json();
        return result;
    } catch (error: unknown) {
        throw Error(`Failed to create group chat, Error: ${error}`);
    }
}

/**
 * Connects to a specific group chat room via WebSocket.
 * Subscribes to the room channel to receive updates.
 * @param roomId - The ID of the room to connect to.
 * @returns {Promise<ConnectGroupChatResponse>} Promise resolving to the connection response.
 */
export const connectGroupChat = async (roomId: string) : Promise<ConnectGroupChatResponse> => {
    try {
        const websocket = getGroupSocket();
        return await new Promise((resolve, reject) => {
            const payload : ConnectGroupChatPayload = {
                subscribe: {
                    channel: `room:${roomId}`
                },
                id: 1
            };

            const messageHandler = (data: Buffer) => {
                try {
                    const message = data.toString('utf-8');
                    const response = JSON.parse(message) as ConnectGroupChatResponse;

                    clearTimeout(timeout);
                    emitter.off('message', messageHandler);
                    resolve(response);
                } catch {}
            };

            emitter.on('message', messageHandler);
            const timeout = setTimeout(() => {
                emitter.off('message', messageHandler);
                reject(new Error('Timeout waiting for response'));
            }, 30000);
            websocket.send(JSON.stringify(payload));
        });
    } catch (error) {
        throw Error(`Failed to connect group chat: ${error}`);
    }
}

/**
 * Disconnects from a specific group chat room via WebSocket.
 * Unsubscribes from the room channel.
 * @param roomId - The ID of the room to disconnect from.
 * @returns {Promise<disconnectGroupChatPayload>} Promise resolving to the disconnection payload/response.
 */
export const disconnectGroupChat = async (roomId: string) : Promise<disconnectGroupChatPayload> => {
    try {
        const websocket = getGroupSocket();
        return await new Promise((resolve, reject) => {
            const payload : disconnectGroupChatPayload = {
                unsubscribe: {
                    channel: `room:${roomId}`
                },
                id: 1
            };

            const messageHandler = (data: Buffer) => {
                try {
                    const message = data.toString('utf-8');
                    const response = JSON.parse(message) as disconnectGroupChatPayload;

                    clearTimeout(timeout);
                    emitter.off('message', messageHandler);
                    resolve(response);
                } catch {}
            };

            emitter.on('message', messageHandler);
            const timeout = setTimeout(() => {
                emitter.off('message', messageHandler);
                reject(new Error('Timeout waiting for response'));
            }, 30000);
            websocket.send(JSON.stringify(payload));
        });
    } catch (error) {
        throw Error(`Failed to disconnect group chat: ${error}`);
    }
}

/**
 * Sends a message to a group chat room.
 * @param message - The text content of the message.
 * @param chatId - The ID of the group chat (room ID) to send the message to.
 * @returns {Promise<MessageGroupResponse>} Promise resolving to the message response, including the created turn.
 */
export const sendGroupMessage = async (message: string, chatId: string): Promise<MessageGroupResponse> => {
    try {
        if (!message) throw Error('Message is required for sending message');
        if (!chatId) throw Error('Chat ID is required for sending message');
        const websocket = getGroupSocket();
        return await new Promise((resolve, reject) => {
            const uuid = v4();
            const profile = getProfile();
            const request: MessageGroupPayload = {
                id: 1,
                rpc: {
                    method: 'unused_command',
                    data: {
                        command: 'create_turn',
                        request_id: uuid,
                        payload: {
                            chat_type: 'TYPE_MU_ROOM',
                            num_candidates: 1,
                            user_name: profile?.user.username,
                            turn: {
                                turn_key: {
                                    turn_id: uuid,
                                    chat_id: chatId,
                                },
                                author: {
                                    author_id: profile.user.id.toString(),
                                    is_human: true,
                                    name: profile.user.username,
                                },
                                candidates: [{
                                    candidate_id: uuid,
                                    raw_content: message,
                                }],
                                primary_candidate_id: uuid
                            },
                        },
                    },
                }
            };

            const messageHandler = (data: Buffer) => {
                try {
                    const message = data.toString('utf-8');
                    const response = JSON.parse(message) as MessageGroupResponse;
                    if (response.push && response?.push?.pub?.data?.request_id === uuid && response?.push?.pub?.data?.turn?.author.is_human && response?.push?.pub?.data?.turn?.candidates[0]?.is_final) {
                        clearTimeout(timeout);
                        emitter.off('message', messageHandler);
                        resolve(response);
                    }
                } catch (e: unknown) {
                    console.log('Send message error', e);
                }
            };

            emitter.on('message', messageHandler);
            const timeout = setTimeout(() => {
                emitter.off('message', messageHandler);
                reject(new Error('Timeout waiting for response'));
            }, 30000);
            websocket.send(JSON.stringify(request));
        });
    } catch (error) {
        throw Error(`Failed to send group message: ${error}`);
    }
};

/**
 * Triggers the characters in the group chat to generate a turn/reply.
 * @param chatId - The ID of the group chat (room ID).
 * @returns {Promise<MessageGroupGenerateTurnResponse>} Promise resolving to the generated turn response.
 */
export const generateTurnGroupMessage = async (chatId: string): Promise<MessageGroupGenerateTurnResponse> => {
    try {
        if (!chatId) throw Error('Chat ID is required for generating turn');
        const websocket = getGroupSocket();
        return await new Promise((resolve, reject) => {
            const uuid = v4();
            const profile = getProfile();
            const request: MessageGroupGenerateTurnRequest = {
                id: 1,
                rpc: {
                    method: 'unused_command',
                    data: {
                        command: 'generate_turn',
                        request_id: uuid,
                        payload: {
                            chat_type: 'TYPE_MU_ROOM',
                            user_name: profile?.user.username,
                            chat_id: chatId,
                            smart_reply: "CHARACTERS",
                            smart_reply_delay: 0
                        },
                        origin_id: "Android"
                    },
                },
            }

            const messageHandler = (data: Buffer) => {
                try {
                    const message = data.toString('utf-8');
                    const response = JSON.parse(message) as MessageGroupGenerateTurnResponse;
                    if (response.push && response?.push?.pub?.data?.request_id === uuid && response?.push?.pub?.data?.turn?.candidates[0]?.is_final) {
                        clearTimeout(timeout);
                        emitter.off('message', messageHandler);
                        resolve(response);
                    }
                } catch (e: unknown) {
                    console.log('Send message error', e);
                }
            };

            emitter.on('message', messageHandler);
            const timeout = setTimeout(() => {
                emitter.off('message', messageHandler);
                reject(new Error('Timeout waiting for response'));
            }, 30000);
            websocket.send(JSON.stringify(request));
        });
    } catch (error) {
        throw Error(`Failed to generate turn group message: ${error}`);
    }
};