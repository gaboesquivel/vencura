// This file is auto-generated. Do not edit manually.

export const operationMeta = {
  "healthCheck": {
    "summary": "Returns server health status with current ISO datetime",
    "description": "Health check endpoint",
    "pathParams": [],
    "bodyParams": []
  },
  "accountApikeysCreate": {
    "summary": "Create API key",
    "description": "Create API key (shown once)",
    "pathParams": [],
    "bodyParams": [
      {
        "name": "name"
      }
    ]
  },
  "accountApikeysList": {
    "summary": "List API keys",
    "description": "List API keys for authenticated user",
    "pathParams": [],
    "bodyParams": []
  },
  "accountApikeysRevoke": {
    "summary": "Revoke API key",
    "description": "Revoke API key",
    "pathParams": [
      {
        "name": "id"
      }
    ],
    "bodyParams": []
  },
  "accountProfileUpdate": {
    "summary": "Update profile",
    "description": "Update profile (name, username)",
    "pathParams": [],
    "bodyParams": [
      {
        "name": "name"
      },
      {
        "name": "username"
      }
    ]
  },
  "chat": {
    "summary": "Generate AI chat response",
    "description": "Chat with AI via Anthropic, Open Router, or Ollama. Set ANTHROPIC_API_KEY, OPEN_ROUTER_API_KEY, or OLLAMA_BASE_URL. Default model configurable via AI_DEFAULT_MODEL. Supports streaming and tools.",
    "pathParams": [],
    "bodyParams": [
      {
        "name": "messages"
      },
      {
        "name": "stream"
      },
      {
        "name": "model"
      },
      {
        "name": "temperature"
      },
      {
        "name": "tools"
      }
    ]
  },
  "generate": {
    "summary": "Generate text from prompt",
    "description": "Generate text from a single prompt (CLI, scripts, pipelines). Uses Anthropic, Open Router, or Ollama. Returns SSE (text/event-stream) when streaming.",
    "pathParams": [],
    "bodyParams": [
      {
        "name": "prompt"
      },
      {
        "name": "stream"
      },
      {
        "name": "model"
      },
      {
        "name": "temperature"
      }
    ]
  },
  "walletsBalance": {
    "summary": "Get balance",
    "description": "Get custodial wallet balance (wei)",
    "pathParams": [
      {
        "name": "id"
      }
    ],
    "bodyParams": []
  },
  "walletsDetail": {
    "summary": "Get wallet",
    "description": "Get custodial wallet by id",
    "pathParams": [
      {
        "name": "id"
      }
    ],
    "bodyParams": []
  },
  "walletsSend": {
    "summary": "Send transaction",
    "description": "Send transaction from custodial wallet",
    "pathParams": [
      {
        "name": "id"
      }
    ],
    "bodyParams": [
      {
        "name": "to"
      },
      {
        "name": "amount"
      }
    ]
  },
  "walletsSign": {
    "summary": "Sign message",
    "description": "Sign message with custodial wallet",
    "pathParams": [
      {
        "name": "id"
      }
    ],
    "bodyParams": [
      {
        "name": "msg"
      }
    ]
  },
  "walletsCreate": {
    "summary": "Create custodial wallet",
    "description": "Create custodial wallet",
    "pathParams": [],
    "bodyParams": []
  },
  "walletsList": {
    "summary": "List wallets",
    "description": "List custodial wallets for authenticated user",
    "pathParams": [],
    "bodyParams": []
  }
} as const

export const commandSpecs = [
  {
    "path": [
      "health-check"
    ],
    "operationId": "healthCheck"
  },
  {
    "path": [
      "account",
      "apikeys",
      "create"
    ],
    "operationId": "accountApikeysCreate"
  },
  {
    "path": [
      "account",
      "apikeys",
      "list"
    ],
    "operationId": "accountApikeysList"
  },
  {
    "path": [
      "account",
      "apikeys",
      "id"
    ],
    "operationId": "accountApikeysRevoke"
  },
  {
    "path": [
      "account",
      "profile"
    ],
    "operationId": "accountProfileUpdate"
  },
  {
    "path": [
      "ai",
      "chat"
    ],
    "operationId": "chat"
  },
  {
    "path": [
      "ai",
      "generate"
    ],
    "operationId": "generate"
  },
  {
    "path": [
      "wallets",
      "id",
      "balance"
    ],
    "operationId": "walletsBalance"
  },
  {
    "path": [
      "wallets",
      "id",
      "detail"
    ],
    "operationId": "walletsDetail"
  },
  {
    "path": [
      "wallets",
      "id",
      "send"
    ],
    "operationId": "walletsSend"
  },
  {
    "path": [
      "wallets",
      "id",
      "sign"
    ],
    "operationId": "walletsSign"
  },
  {
    "path": [
      "wallets-create"
    ],
    "operationId": "walletsCreate"
  },
  {
    "path": [
      "wallets-list"
    ],
    "operationId": "walletsList"
  }
] as const
