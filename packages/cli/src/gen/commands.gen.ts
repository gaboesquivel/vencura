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
  }
] as const
