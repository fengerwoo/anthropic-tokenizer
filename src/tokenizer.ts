import { countTokens } from "@anthropic-ai/tokenizer";
import type {
  Message,
  ContentBlock,
  Tool,
  CountTokensRequest,
} from "./types.js";

/**
 * Extract text from a content block
 */
function extractTextFromContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case "text":
      return block.text;
    case "tool_use":
      // Tool use includes name and JSON input
      return `${block.name}${JSON.stringify(block.input)}`;
    case "tool_result":
      if (typeof block.content === "string") {
        return block.content;
      }
      return block.content.map(extractTextFromContentBlock).join("");
    case "image":
      // Images contribute tokens but we can't count them accurately with text tokenizer
      // Return a placeholder estimation (roughly 85 tokens for small images, more for larger)
      return "[image]";
    case "document":
      // Documents also contribute tokens
      return "[document]";
    default:
      return "";
  }
}

/**
 * Extract text from message content
 */
function extractTextFromMessage(message: Message): string {
  const rolePrefix = `${message.role}: `;

  if (typeof message.content === "string") {
    return rolePrefix + message.content;
  }

  const contentText = message.content.map(extractTextFromContentBlock).join("");
  return rolePrefix + contentText;
}

/**
 * Extract text from system content
 */
function extractTextFromSystem(
  system: string | ContentBlock[] | undefined
): string {
  if (!system) {
    return "";
  }

  if (typeof system === "string") {
    return `system: ${system}`;
  }

  const systemText = system.map(extractTextFromContentBlock).join("");
  return `system: ${systemText}`;
}

/**
 * Generate tool definition text for token counting
 */
function extractTextFromTools(tools: Tool[] | undefined): string {
  if (!tools || tools.length === 0) {
    return "";
  }

  return tools
    .map((tool) => {
      let toolText = `tool:${tool.name}`;
      if (tool.description) {
        toolText += `:${tool.description}`;
      }
      if (tool.input_schema) {
        toolText += JSON.stringify(tool.input_schema);
      }
      return toolText;
    })
    .join("");
}

/**
 * Count tokens for a complete request
 *
 * Note: This uses @anthropic-ai/tokenizer which is designed for older Claude models.
 * For Claude 3+ models, this provides an approximation only.
 * For accurate counts, use the official Anthropic API's count_tokens endpoint.
 */
export function countRequestTokens(request: CountTokensRequest): number {
  const parts: string[] = [];

  // Add system prompt
  const systemText = extractTextFromSystem(request.system);
  if (systemText) {
    parts.push(systemText);
  }

  // Add tools
  const toolsText = extractTextFromTools(request.tools);
  if (toolsText) {
    parts.push(toolsText);
  }

  // Add messages
  for (const message of request.messages) {
    parts.push(extractTextFromMessage(message));
  }

  // Combine all parts and count tokens
  const fullText = parts.join("\n");
  return countTokens(fullText);
}

/**
 * Count tokens for a simple text string
 */
export function countTextTokens(text: string): number {
  return countTokens(text);
}
