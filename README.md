# THIS PACKAGE HEAVILY INSPIRED BY [node_characterai](https://github.com/realcoloride/node_characterai/tree/2.0) PACKAGE.

# Character AI (Node) Package

Simple Node.js library for interacting with Character.AI via HTTP and WebSocket with typescript. It provides simple primitives to authenticate, create chats, send messages, and fetch chat turns. Perfect usage for route handlers in Node.js applications that need interactions with Character.AI in custom interface.

## Features
- Authenticate with a session token and initialize a WebSocket
- Create one-on-one chats with characters
- Create group chats with characters
- Send messages and await final replies
- Fetch chat turns (messages) with pagination
- Minimal, typed API with clear data models

## Installation

```bash
npm install simple_node_characterai
```

## Quick Start

```ts
import { authenticate, createNewConversation, sendMessage, getMessages, getProfile } from 'simple_node_characterai';

(async () => {
  // 1) Authenticate with your session token (string without "Token " prefix is fine)
  await authenticate('YOUR_SESSION_TOKEN');

  // 2) Access the authenticated user profile
  const profile = getProfile();
  console.log('Logged in as:', profile.user.username);

  // 3) Create a new chat with a character
  const characterId = 'CHARACTER_ID';
  const addTurn = await createNewConversation(characterId);
  const chatId = addTurn.turn.turn_key.chat_id;

  // 4) Send a message and wait for the final candidate
  const response = await sendMessage('Hello!', characterId, chatId);
  console.log(response.turn.candidates[0].raw_content);

  // 5) Fetch latest turns (up to 50)
  const turns = await getMessages(chatId);
  console.log('Turns count:', turns.length);
})();
```

## Example with Hono Route Handler
```ts
import { Hono } from 'hono'
import { authenticate, createNewConversation, sendMessage, getMessages, getProfile } from 'simple_node_characterai';

const app = new Hono();

(async () => {
  await authenticate(process.env.CHARACTERAI_TOKEN!);
})();

// Creates a new one-on-one conversation
// Body: { characterId: string } -> Response: { chatId: string }
app.post('/conversations', async (c) => {
  try {
    const body = await c.req.json();
    const characterId = body?.characterId;
    if (!characterId) return c.json({ error: 'characterId is required' }, 400);
    const addTurn = await createNewConversation(characterId);
    const chatId = addTurn.turn.turn_key.chat_id;
    return c.json({ chatId });
  } catch (e) {
    return c.json({ error: 'failed to create conversation' }, 500);
  }
});

// Sends a message to a conversation and returns the final content
// Body: { message: string, characterId: string, chatId: string }
// Make sure to store the characterId and chatId somewhere, like Database
// The messages field can be get in response.turn.candidates[0].raw_content
app.post('/messages', async (c) => {
  try {
    const body = await c.req.json();
    const message = body?.message;
    const characterId = body?.characterId;
    const chatId = body?.chatId;
    if (!message || !characterId || !chatId) {
      return c.json({ error: 'message, characterId, and chatId are required' }, 400);
    }
    const response = await sendMessage(message, characterId, chatId);
    const final = response.turn.candidates?.[0];
    return c.json({
      turn: response.turn,
      content: final?.raw_content ?? null
    });
  } catch (e) {
    return c.json({ error: 'failed to send message' }, 500);
  }
});

// Fetches up to 50 turns for the given chatId
// Optional query: ?token=NEXT_TOKEN for pagination
// Token will be available in meta field of response if there's more turns to fetch.
app.get('/messages/:chatId', async (c) => {
  try {
    const chatId = c.req.param('chatId');
    const token = c.req.query('token') ?? undefined;
    const messages = await getMessages(chatId, token);
    return c.json({ turns: messages.turns, token: messages.meta.next_token });
  } catch (e) {
    return c.json({ error: 'failed to fetch messages' }, 500);
  }
});

export default app
```

## Group Chat Quick Start

**Warning**: Connection to room chat is cannot more than 1 connection. so you cannot mass use it.

```ts
import { 
  authenticate,
  createGroupChat
  listGroupChat,
  connectGroupChat,
  sendGroupMessage,
  generateTurnGroupMessage,
  disconnectGroupChat
} from 'simple_node_characterai';

(async () => {
  await authenticate('YOUR_SESSION_TOKEN');

  // 1) List Groups
  const listGroups = await listGroupChats();

  // 2) Create Group Chat
  const createGroupChat = await createGroupChat('My Group Chat', ['CHARACTER_ID_1', 'CHARACTER_ID_2']);

  // Assuming we pick the first room or use a known ID
  const roomId = 'ROOM_ID'; 

  // 3) Connect
  const connect = await connectGroupChat(roomId);

  // 4) Send Message
  const sendMessage = await sendGroupMessage('Hi!', roomId);
  console.log(JSON.stringify(sendMessage, null, 4));

  // 5) Generate Turn Message
  const generateResponse = await generateTurnGroupMessage(roomId);
  console.log(JSON.stringify(generateResponse.push, null, 4));

  // 6) Disconnect
  await disconnectGroupChat(roomId);
})();
```

## Example with Hono Route Handler (Group Chat)

```ts
import { Hono } from 'hono'
import { 
  authenticate,
  listGroupChat,
  CreateGroupChat
  connectGroupChat,
  sendGroupMessage,
  generateTurnGroupMessage,
  disconnectGroupChat
} from 'simple_node_characterai';

const app = new Hono();

(async () => {
  await authenticate(process.env.CHARACTERAI_TOKEN!);
})();

// List all group chats
app.get('/group', async (c) => {
  try {
    const list = await listGroupChat();
    return c.json(list);
  } catch (e) {
    return c.json({ error: 'Failed to list groups' }, 500);
  }
});

// Create a group chat
// Body: {title: string, characterIds: string | string[]}
// Store the id somewhere
app.post('/group', async (c) => {
  try {
    const body = await c.req.json();
    const title = body?.title;
    const characterIds = body?.characterIds;
    if (!title || !characterIds) return c.json({ error: 'title and characterIds are required' }, 400);
    const createGroupChat = await createGroupChat(title, characterIds);
    return c.json(createGroupChat);
  } catch (e) {
    return c.json({ error: 'Failed to create group chat' }, 500);
  }
});

// Connect to a group chat room
// Params: { roomId: string }
app.post('/group/:roomId/connect', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    if (!roomId) return c.json({ error: 'roomId is required' }, 400);
    const connect = await connectGroupChat(roomId);
    return c.json(connect);
  } catch (e) {
    return c.json({ error: 'Failed to connect' }, 500);
  }
});

// Send a message to a group chat
// Body: { message: string }
// After sending a message, you must generate a turn to get the response, this message function is return your message, not the character reply itself
app.post('/group/:roomId/message', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    if (!roomId) return c.json({ error: 'roomId is required' }, 400);
    const body = await c.req.json();
    const message = body?.message;
    if (!message) return c.json({ error: 'Message is required' }, 400);
    const sendMessage = await sendGroupMessage(message, roomId);
    return c.json(sendMessage);
  } catch (e) {
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Generate a turn in the group chat after sending a message
app.post('/group/:roomId/generate', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    if (!roomId) return c.json({ error: 'roomId is required' }, 400);
    const generateResponse = await generateTurnGroupMessage(roomId);
    return c.json(generateResponse);
  } catch (e) {
    return c.json({ error: 'Failed to generate turn' }, 500);
  }
});

// Disconnect a group chat room
// Params: { roomId: string }
app.post('/group/:roomId/disconnect', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    if (!roomId) return c.json({ error: 'roomId is required' }, 400);
    const disconnect = await disconnectGroupChat(roomId);
    return c.json(disconnect);
  } catch (e) {
    return c.json({ error: 'Failed to disconnect' }, 500);
  }
});

export default app
```

## Find Authorization Token
<img width="795" height="550" alt="image" src="https://github.com/user-attachments/assets/fefe6262-00cb-4a1f-82da-51a4c96ef299" />

1. Logged in to [character.ai](https://character.ai)
2. Make sure to select any character first
3. Open the developer tools <code> F12, FN + F12, CTRL + SHIFT + I</code>
4. Go to `Application` tab
5. Navigate to Cookies section, and select https://character.ai cookies
6. Look up for `HTTP_AUTHORIZATION` token with string that starts with `Token `
7. If token doesn't present, refresh the page and see the token again
8. Copy the value

Sometimes the token will show up for a minutes and dissapear.

## Find Character ID and Chat ID
<img width="859" height="46" alt="image" src="https://github.com/user-attachments/assets/37f03b58-1cd0-436f-aa31-941fc2791620" />

Logged in to [character.ai](https://character.ai), and select a character you want to chat, then look up at URL, the URL contains the Character and Chat ID with following detail:
```
https://character.ai/chat/{characterId}?hist={chatId}
```

## API Reference

### Auth

#### authenticate(sessionToken: string): Promise<void>
- Authenticates the user, validates the token, loads the profile, and opens the WebSocket.
- Accepts either raw token or `"Token XXX"` format.

#### getProfile(): Profile
- Returns the in-memory authenticated user profile.

### Chat

#### createNewConversation(characterId: string): Promise<AddTurnResponse>
- Creates a new one-on-one chat with the specified character and resolves when the greeting turn arrives.
- Returns metadata and the initial turn.

#### sendMessage(message: string, characterId: string, chatId: string): Promise<UpdateTurnResponse>
- Sends a user message to an existing chat.
- Resolves when the model returns a final candidate for the turn.

#### getMessages(chatId: string, token?: string): Promise<Turn[]>
- Retrieves up to 50 turns for the given chat.
- If a `token` is provided, fetches the next page of results using `next_token`.

### Group Chat

#### listGroupChat(): Promise<{rooms: GroupChat[]}>
- Lists all group chats (rooms) the user is a member of.

#### createGroupChat(title: string, characters_id: string | string[]): Promise<GroupChat>
- Creates a new group chat room with specified characters.

#### connectGroupChat(roomId: string): Promise<ConnectGroupChatResponse>
- Connects to a specific group chat room via WebSocket.

#### disconnectGroupChat(roomId: string): Promise<disconnectGroupChatPayload>
- Disconnects from a specific group chat room via WebSocket.

#### sendGroupMessage(message: string, chatId: string): Promise<MessageGroupResponse>
- Sends a message to a group chat room.

#### generateTurnGroupMessage(chatId: string): Promise<MessageGroupGenerateTurnResponse>
- Triggers the characters in the group chat to generate a turn/reply.

## Notes
- This package is intended for personal use.
- Avoid logging tokens, cookies, or PII; keep sensitive information in memory.
- When building client-side applications, follow CORS restrictions; this package is designed for server-side Node usage.

## Development
Still in development but ready to use for basic chatting usage, more feature will be added in the future.

## Support
If you like this package, support me with stars in github, its help me so much