export interface ResponseError {
  command: "neo_error";
  request_id: string;
  comment: string;
  error_code: number;
  sub_code: string | null;
  retry_after_seconds: number | null;
}

export interface TurnKey {
  turn_id: string;
  chat_id: string;
}

export interface Author {
  author_id: string;
  is_human?: boolean; // Present in request payload and add_turn response
  name: string;
}

export interface Editor {
    author_id: string;
    name: string;
}

export interface Candidate {
  candidate_id: string;
  raw_content: string;
  create_time?: string; // Present in add_turn and update_turn response
  is_final?: boolean; // Present in add_turn (final) and update_turn (final) response
  model_type?: string; // Present in add_turn (first response) and update_turn response
  editor?: Editor; // Present when edited
}

export interface PreviousAnnotations {
  boring: number;
  not_boring: number;
  inaccurate: number;
  not_inaccurate: number;
  repetitive: number;
  not_repetitive: number;
  out_of_character: number;
  not_out_of_character: number;
  bad_memory: number;
  not_bad_memory: number;
  long: number;
  not_long: number;
  short: number;
  not_short: number;
  ends_chat_early: number;
  not_ends_chat_early: number;
  funny: number;
  not_funny: number;
  interesting: number;
  not_interesting: number;
  helpful: number;
  not_helpful: number;
}

export interface Turn {
  turn_key: TurnKey;
  author: Author;
  candidates: Candidate[];
  primary_candidate_id: string;
  create_time?: string; // Present in add_turn and update_turn response
  last_update_time?: string; // Present in add_turn and update_turn response
  state?: string; // Present in add_turn and update_turn response
}

export interface Payload {
  chat_type: 'TYPE_ONE_ON_ONE';
  num_candidates: number;
  tts_enabled: boolean;
  selected_language: string;
  character_id: string;
  user_name: string;
  turn: Turn;
  previous_annotations: PreviousAnnotations;
  generate_comparison: boolean;
}

// Payload to send message
export interface CreateAndGenerateTurnRequest {
  command: 'create_and_generate_turn';
  request_id: string;
  payload: Payload;
  origin_id: 'web-next' | 'Android';
}

export interface ChatInfo {
    type: 'TYPE_ONE_ON_ONE';
}

export interface GenerationMode {
    mode: 'MODE_NORMAL';
    remaining_quota_frac: number;
}

// Response after sending message (add_turn)
export interface AddTurnResponse {
    turn: Turn;
    chat_info: ChatInfo;
    command: 'add_turn';
    request_id: string;
    generation_mode?: GenerationMode; // Present in first character response
}

// Response for turn update (update_turn)
export interface UpdateTurnResponse {
    turn: Turn;
    chat_info: ChatInfo;
    generation_mode: GenerationMode;
    command: 'update_turn';
    request_id: string;
}

export interface ChatProperties {
    chat_id: string;
    creator_id: string | number;
    visibility: 'VISIBILITY_PRIVATE';
    character_id: string;
    type: 'TYPE_ONE_ON_ONE';
}

export interface CreateChatPayload {
    chat_type: 'TYPE_ONE_ON_ONE';
    chat: ChatProperties;
    with_greeting: boolean;
}

export interface CreateChatRequest {
    command: 'create_chat';
    request_id: string;
    payload: CreateChatPayload;
    origin_id: 'web-next' | 'Android';
}

export interface ChatResponseProperties {
    chat_id: string;
    create_time: string;
    creator_id: string;
    character_id: string;
    state: 'STATE_ACTIVE';
    type: 'TYPE_ONE_ON_ONE';
    visibility: 'VISIBILITY_PRIVATE';
    preferred_model_type: 'MODEL_TYPE_DEEP_SYNTH_LITE';
    model_preference_version: string;
}

export interface CreateChatResponse {
    chat: ChatResponseProperties;
    command: 'create_chat_response';
    request_id: string;
}


// Group
export interface GroupChatSettings {
  anyone_can_join: boolean;
  require_approval: boolean;
}

export interface CreateGroupChatPayload {
  characters: string[];
  title: string;
  settings: GroupChatSettings;
  visibility: 'VISIBILITY_UNLISTED';
  with_greeting: boolean;
}

export interface GroupChatCharacter {
  id: string;
  name: string;
  avatar_url: string;
}

export interface GroupChatUser {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  role: string;
  state: string;
}

export interface GroupChatPreviewTurnCandidateEditor {
  author_id: string;
  name: string;
}

export interface GroupChatPreviewTurnCandidate {
  candidate_id: string;
  create_time: string;
  raw_content: string;
  editor: GroupChatPreviewTurnCandidateEditor;
  is_final: boolean;
}

export interface GroupChatPreviewTurnKey {
  chat_id: string;
  turn_id: string;
}

export interface GroupChatPreviewTurnAuthor {
  author_id: string;
  name: string;
}

export interface GroupChatPreviewTurn {
  turn_key: GroupChatPreviewTurnKey;
  create_time: string;
  last_update_time: string;
  state: string;
  author: GroupChatPreviewTurnAuthor;
  candidates: GroupChatPreviewTurnCandidate[];
  primary_candidate_id: string;
}

export interface GroupChatPreviewTurnMeta {
  next_token: string;
}

export interface GroupChatPreviewTurnItem {
  turns: GroupChatPreviewTurn;
  meta: GroupChatPreviewTurnMeta;
}

export interface GroupChatSettings {
  anyone_can_join: boolean;
  require_approval: boolean;
  auto_smart_reply: boolean;
  smart_reply_timer: boolean;
  join_token: string;
  user_limit: number;
  character_limit: number;
  push_notification_mode: "PUSH_NOTIFICATION_MODE_UNSPECIFIED";
}

export interface GroupChat {
  id: string;
  title: string;
  description: string;
  visibility: string;
  picture: string;
  last_updated: number;
  characters: GroupChatCharacter[];
  users: GroupChatUser[];
  permissions: string[];
  preview_turns: GroupChatPreviewTurnItem[];
  settings: GroupChatSettings;
}

export interface ConnectGroupChatPayload {
  subscribe: {
    channel: string,
  }
  id: number
}

export interface ConnectGroupChatResponse {
  id: number;
  connect: {
    client: string;
    version: string;
    ping: number;
    pong: boolean;
  };
}

export interface disconnectGroupChatPayload {
  unsubscribe: {
    channel: string,
  }
  id: number
}

export interface disconnectGroupChatResponse {
  id: number
  subscribe: Object;
}

export interface MessageGroupTurnKeyPayload {
  turn_id: string;
  chat_id: string; // "room:..." ID for group chat
}

export interface MessageGroupAuthorPayload {
  author_id: number | string;
  is_human: boolean;
  name: string;
}

export interface MessageGroupCandidatePayload {
  candidate_id: string;
  raw_content: string;
  tti_image_rel_path?: string; // Optional image URL
}

export interface MessageGroupTurnPayload {
  turn_key: MessageGroupTurnKeyPayload;
  author: MessageGroupAuthorPayload;
  candidates: MessageGroupCandidatePayload[];
  primary_candidate_id: string;
}

export interface MessageGroupData {
  chat_type: 'TYPE_MU_ROOM'; // Identifies Group Chat
  num_candidates: number;
  user_name: string;
  turn: MessageGroupTurnPayload;
}
export interface MessageGroupPayload {
  rpc: {
    method: 'unused_command';
    data: {
      command: 'create_turn';
      request_id: string;
      payload: MessageGroupData;
    };
  };
  id: number;
}

export interface MessageGroupGenerateTurnPayload {
  chat_type: 'TYPE_MU_ROOM';
  chat_id: string;
  user_name: string;
  smart_reply: 'CHARACTERS';
  smart_reply_delay: number;
}

export interface MessageGroupGenerateTurnRpc {
  method: 'unused_command';
  data: {
    command: 'generate_turn';
    request_id: string;
    payload: MessageGroupGenerateTurnPayload;
    origin_id: 'web-next' | 'Android';
  };
}

export interface MessageGroupGenerateTurnRequest {
  rpc: MessageGroupGenerateTurnRpc;
  id: number;
}


// RESPONSE OF SEND GROUP MESSAGE (NOT THE CHARACTER)
export interface MessageGroupResponseTurnKey {
  chat_id: string;
  turn_key: string;
}

export interface MessageGroupResponseAuthor {
  author_id: string;
  is_human: string;
  name: string;
}

export interface MessageGroupResponseCandidateEditor {
  author_id: string;
}

export interface MessageGroupResponseCandidate {
  candidate_id: string;
  create_time: string;
  raw_content: string;
  tti_image_rel_path: string;
  base_candidate_id: string;
  editor: MessageGroupResponseCandidateEditor;
  is_final: boolean;
}

export interface MessageGroupResponseTurn {
  turn_key: MessageGroupResponseTurnKey;
  create_time: string;
  last_update_time: string;
  state: string;
  author: MessageGroupResponseAuthor;
  candidates: MessageGroupResponseCandidate[];
  primary_candidate_id: string;
}

export interface MessageGroupResponseChatInfo {
  type: "TYPE_MU_ROOM";
}

export interface MessageGroupResponseData {
  turn: MessageGroupResponseTurn;
  chat_info: MessageGroupResponseChatInfo;
  command: "add_turn";
  request_id: string;
}

export interface MessageGroupResponsePub {
  data: MessageGroupResponseData;
}

export interface MessageGroupResponsePush {
  channel: string;
  pub: MessageGroupResponsePub;
}

export interface MessageGroupResponse {
  push: MessageGroupResponsePush;
  offset: number;
}

export interface MessageGroupGenerateTurnResponseTurnKey {
  chat_id: string;
  turn_id: string;
}

export interface MessageGroupGenerateTurnResponseAuthor {
  author_id: string;
  name: string;
}

export interface MessageGroupGenerateTurnResponseCandidate {
  candidate_id: string;
  create_time: string;
  raw_content: string;
  is_final: boolean;
  model_type: string;
}

export interface MessageGroupGenerateTurnResponseTurn {
  turn_key: MessageGroupGenerateTurnResponseTurnKey;
  create_time: string;
  last_update_time: string;
  state: string;
  author: MessageGroupGenerateTurnResponseAuthor;
  candidates: MessageGroupGenerateTurnResponseCandidate[];
  primary_candidate_id: string;
}

export interface MessageGroupGenerateTurnResponseChatInfo {
  type: "TYPE_MU_ROOM";
}

export interface MessageGroupGenerateTurnResponseGenerationMode {
  mode: string;
  remaining_quota_frac: number;
}

export interface MessageGroupGenerateTurnResponseData {
  turn: MessageGroupGenerateTurnResponseTurn;
  chat_info: MessageGroupGenerateTurnResponseChatInfo;
  smart_reply_status: string;
  generation_mode: MessageGroupGenerateTurnResponseGenerationMode;
  command: string;
  request_id: string;
}

export interface MessageGroupGenerateTurnResponsePub {
  data: MessageGroupGenerateTurnResponseData;
  offset: number;
}

export interface MessageGroupGenerateTurnResponsePush {
  channel: string;
  pub: MessageGroupGenerateTurnResponsePub;
}

export interface MessageGroupGenerateTurnResponse {
  push: MessageGroupGenerateTurnResponsePush;
}
