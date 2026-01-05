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
  origin_id: 'web-next';
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
    origin_id: 'web-next';
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