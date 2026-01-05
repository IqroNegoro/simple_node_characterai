# THIS PACKAGE HEAVILY INSPIRED BY [node_characterai](https://github.com/realcoloride/node_characterai/tree/2.0) PACKAGE.

# Character AI (Node) Package

Simple Node.js library for interacting with Character.AI via HTTP and WebSocket with typescript. It provides simple primitives to authenticate, create chats, send messages, and fetch chat turns. Perfect usage for route handlers in Node.js applications that need interactions with Character.AI in custom interface.

## Features
- Authenticate with a session token and initialize a WebSocket
- Create one-on-one chats with characters
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

## Notes
- This package is intended for personal use.
- Avoid logging tokens, cookies, or PII; keep sensitive information in memory.
- When building client-side applications, follow CORS restrictions; this package is designed for server-side Node usage.

## Development
Still in development but ready to use for basic chatting usage, more feature will be added in the future.