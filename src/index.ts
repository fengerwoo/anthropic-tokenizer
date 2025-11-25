import express, { Request, Response, NextFunction } from "express";
import { countRequestTokens, countTextTokens } from "./tokenizer.js";
import type {
  CountTokensRequest,
  CountTokensResponse,
  ErrorResponse,
} from "./types.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: "50mb" }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * POST /v1/messages/count_tokens
 *
 * Compatible with Anthropic's official API:
 * https://docs.anthropic.com/en/api/messages-count-tokens
 *
 * Request body:
 * - model (string, required): Model name (used for compatibility, actual counting uses the tokenizer)
 * - messages (array, required): Array of messages with role and content
 * - system (string|array, optional): System prompt
 * - tools (array, optional): Tool definitions
 *
 * Response:
 * - input_tokens (number): Total token count
 */
app.post(
  "/v1/messages/count_tokens",
  (req: Request, res: Response): void => {
    try {
      const body = req.body as CountTokensRequest;

      // Validate required fields
      if (!body.model) {
        const error: ErrorResponse = {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "model: Field required",
          },
        };
        res.status(400).json(error);
        return;
      }

      if (!body.messages || !Array.isArray(body.messages)) {
        const error: ErrorResponse = {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "messages: Field required",
          },
        };
        res.status(400).json(error);
        return;
      }

      // Validate messages structure
      for (let i = 0; i < body.messages.length; i++) {
        const msg = body.messages[i];
        if (!msg.role || !["user", "assistant"].includes(msg.role)) {
          const error: ErrorResponse = {
            type: "error",
            error: {
              type: "invalid_request_error",
              message: `messages.${i}.role: Invalid role "${msg.role}"`,
            },
          };
          res.status(400).json(error);
          return;
        }
        if (msg.content === undefined || msg.content === null) {
          const error: ErrorResponse = {
            type: "error",
            error: {
              type: "invalid_request_error",
              message: `messages.${i}.content: Field required`,
            },
          };
          res.status(400).json(error);
          return;
        }
      }

      // Count tokens
      const inputTokens = countRequestTokens(body);

      const response: CountTokensResponse = {
        input_tokens: inputTokens,
      };

      res.json(response);
    } catch (err) {
      console.error("Error counting tokens:", err);
      const error: ErrorResponse = {
        type: "error",
        error: {
          type: "api_error",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      };
      res.status(500).json(error);
    }
  }
);

/**
 * POST /v1/count_tokens
 *
 * Simple endpoint for counting tokens in plain text
 *
 * Request body:
 * - text (string, required): Text to count tokens for
 *
 * Response:
 * - token_count (number): Token count
 */
app.post("/v1/count_tokens", (req: Request, res: Response): void => {
  try {
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string") {
      const error: ErrorResponse = {
        type: "error",
        error: {
          type: "invalid_request_error",
          message: "text: Field required and must be a string",
        },
      };
      res.status(400).json(error);
      return;
    }

    const tokenCount = countTextTokens(text);

    res.json({ token_count: tokenCount });
  } catch (err) {
    console.error("Error counting tokens:", err);
    const error: ErrorResponse = {
      type: "error",
      error: {
        type: "api_error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
    };
    res.status(500).json(error);
  }
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  const error: ErrorResponse = {
    type: "error",
    error: {
      type: "not_found_error",
      message: "The requested endpoint does not exist",
    },
  };
  res.status(404).json(error);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Anthropic Token Counter Service                        ║
╠════════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT.toString().padEnd(24)}║
║                                                                ║
║  Endpoints:                                                    ║
║  • POST /v1/messages/count_tokens  - Anthropic API compatible  ║
║  • POST /v1/count_tokens           - Simple text counting      ║
║  • GET  /health                    - Health check              ║
║                                                                ║
║  Note: Token counts are approximate for Claude 3+ models       ║
╚════════════════════════════════════════════════════════════════╝
`);
});

export default app;
