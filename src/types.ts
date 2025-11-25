/**
 * Types compatible with Anthropic's /v1/messages/count_tokens API
 */

// Content block types
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageSource {
  type: "base64" | "url";
  media_type?: string;
  data?: string;
  url?: string;
}

export interface ImageContent {
  type: "image";
  source: ImageSource;
}

export interface DocumentSource {
  type: "base64" | "url";
  media_type?: string;
  data?: string;
  url?: string;
}

export interface DocumentContent {
  type: "document";
  source: DocumentSource;
}

export interface ToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: "tool_result";
  tool_use_id: string;
  content: string | ContentBlock[];
}

export type ContentBlock =
  | TextContent
  | ImageContent
  | DocumentContent
  | ToolUseContent
  | ToolResultContent;

// Message type
export interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

// Tool definition
export interface ToolInputSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  input_schema: ToolInputSchema;
}

// Request body for count_tokens
export interface CountTokensRequest {
  model: string;
  messages: Message[];
  system?: string | ContentBlock[];
  tools?: Tool[];
  tool_choice?: {
    type: "auto" | "any" | "tool";
    name?: string;
  };
}

// Response from count_tokens
export interface CountTokensResponse {
  input_tokens: number;
}

// Error response
export interface ErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}
