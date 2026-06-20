export interface CohereMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CohereChatRequest {
  model: string;
  messages: CohereMessage[];
  response_format: { type: "json_object" };
  temperature: number;
  seed: number;
  max_tokens: number;
  thinking?: { type: "disabled" };
}

export interface ProxyRequestBody extends CohereChatRequest {
  apiKey?: string;
}

export interface CohereChatResponse {
  message?: {
    content?: Array<{ type: string; text: string }>;
  };
  // Older V2 response shape fallback
  text?: string;
  finish_reason?: string;
}

export interface ProxyErrorPayload {
  error: string;
  detail?: string;
  raw?: string;
}
