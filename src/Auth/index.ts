import { type Profile } from "#types";
import { connect } from "../Websocket";
import { updateToken, request } from "../api";

let user: Profile = {} as Profile;

/**
 * Authenticates the user and initializes WebSocket connection.
 * Validates the session token, loads user profile, and connects to chat.
 * @param sessionToken - Character.AI session token (with or without "Token " prefix).
 * @returns Resolves when authentication and connection complete.
 */
export const authenticate = async (sessionToken: string) : Promise<void> => {
    if (sessionToken.startsWith("Token ")) sessionToken = sessionToken.substring("Token ".length, sessionToken.length);

    updateToken(sessionToken);

    const req = await request("https://plus.character.ai/chat/user/settings/", {
        method: "GET",
        includeAuthorization: true
    });
    if (!req.ok) throw Error("Invaild authentication token.");

    await loadProfile();
    await connect({
        edgeRollout: "60",
        authorization: sessionToken
    });
}

/**
 * Loads the current user's profile into memory.
 * Uses authorized request to fetch user details from Character.AI.
 * @returns Resolves when the profile has been populated.
 */
const loadProfile = async () : Promise<void> => {
    const result = await request("https://plus.character.ai/chat/user/", {
        method: 'GET',
        includeAuthorization: true
    });
    const profile = await result.json();
    Object.assign(user, profile.user);
}

/**
 * Returns the authenticated user's profile.
 * @returns Profile object of the current user.
 */
export const getProfile = () : Profile => user;
