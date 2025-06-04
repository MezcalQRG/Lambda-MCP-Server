# MCP Weather Server (TypeScript)

This project is a fully functional Model Context Protocol (MCP) server implemented in TypeScript. It demonstrates how to expose LLM tools over both stdio (for desktop clients like Claude) and HTTP (for RESTful integration/testing) using Node.js, Express, and the official @modelcontextprotocol/sdk.

---

## What is MCP?
MCP (Model Context Protocol) is an open protocol for connecting LLMs (like Claude, GPT, etc.) to external tools, APIs, and resources in a standardized way. MCP lets you expose functions ("tools") that LLMs can call, with clear schemas and safe execution.

---

## Features
- **Implements MCP protocol** using the official SDK
- **Exposes two tools:**
  - `get-alerts`: Get weather alerts for a US state
  - `get-forecast`: Get weather forecast for a latitude/longitude
- **Two server modes:**
  - **Stdio mode:** For integration with Claude for Desktop and other MCP-native clients
  - **HTTP mode:** For RESTful access and easy testing with curl/Postman
- **Modern TypeScript project structure**

---

## How it Works (Step by Step)

### 1. Tool Definition
Tools are defined in `src/index.ts` using the MCP SDK. Each tool has:
- A name (e.g. `get-alerts`)
- A description
- An input schema (using [zod](https://zod.dev/))
- An async handler function

### 2. MCP Server Instance
The MCP server is created with:
```typescript
const server = new McpServer({
  name: "weather-mcp-typescript",
  version: "1.0.0",
  capabilities: { resources: {}, tools: {} },
});
```

### 3. Stdio Mode (for Claude for Desktop)
- Run: `node build/index.js`
- The server listens for JSON-RPC requests on stdin/stdout (the MCP standard for desktop integration).
- Claude for Desktop (or any MCP client) can connect and call your tools.

### 4. HTTP Mode (for REST/Testing)
- Run: `node build/http-server.js`
- The server exposes a `/mcp` endpoint on port 3000.
- You can send JSON-RPC requests via HTTP POST (e.g. with curl or Postman).
- This is great for local testing, demos, or RESTful integration.

### 5. Minimal HTTP Handler
Because the SDK does not currently export a Streamable HTTP server transport, we provide a minimal Express handler in `src/http-server.ts` that:
- Accepts POST requests to `/mcp`
- Parses the JSON-RPC body
- Routes `tools/list` and `tools/call` to the correct tool handlers
- Returns a valid JSON-RPC response

---

## Getting Started

### Prerequisites
- Node.js v16 or higher
- npm

### Setup
```bash
npm install
npm run build
```

### Running the Server (Stdio Mode)
```bash
node build/index.js
```
- For use with Claude for Desktop or any MCP stdio client.

### Running the Server (HTTP Mode)
```bash
node build/http-server.js
```
- For RESTful access and easy testing.
- The server will listen at [http://localhost:3000/mcp](http://localhost:3000/mcp)

### Example: List Tools with curl
```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Example: Call a Tool
```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get-alerts","arguments":{"state":"CA"}}}'
```

---

## Tutorial: How to Add a New Tool

Adding a new tool to your MCP server is straightforward. Follow these steps to expose any function as a tool callable by LLMs or HTTP clients:

### 1. Define Your Tool in `src/index.ts`
Each tool is registered with the MCP server using the `server.tool` method. You provide:
- A unique name (string, kebab-case recommended)
- A description (string)
- An input schema (using [zod](https://zod.dev/))
- An async handler function

**Example: Add a tool to reverse a string**

```typescript
import { z } from "zod";

server.tool(
  "reverse-string",
  "Reverse a given string.",
  {
    text: z.string().describe("The string to reverse"),
  },
  async ({ text }) => {
    return text.split("").reverse().join("");
  }
);
```

### 2. Update the HTTP Handler (Optional)
If you want your tool to be available via HTTP, add it to the `toolHandlers` and `getTools` registry in `src/http-server.ts`:

```typescript
// In toolHandlers:
"reverse-string": async ({ text }) => {
  return text.split("").reverse().join("");
},

// In getTools():
{
  name: "reverse-string",
  description: "Reverse a given string.",
  inputSchema: {
    type: "object",
    properties: { text: { type: "string", description: "The string to reverse" } },
    required: ["text"],
  },
},
```

### 3. Rebuild and Restart
```bash
npm run build
node build/http-server.js
```

### 4. Test Your Tool
```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"reverse-string","arguments":{"text":"hello"}}}'
```
Expected response:
```json
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"olleh"}]}}
```

---

**Tips:**
- Use clear, descriptive names and input schemas.
- Document your tool with a helpful description.
- Use zod for robust input validation.
- You can add as many tools as you like—just repeat the pattern above!

## Project Structure
- `src/index.ts` — MCP server and tool definitions (stdio mode)
- `src/http-server.ts` — Minimal Express HTTP handler for MCP (HTTP mode)
- `build/` — Compiled JavaScript output
- `package.json`, `tsconfig.json` — Project config

---

## How to Extend
- Add new tools in `src/index.ts` using the same pattern
- Update the HTTP handler in `src/http-server.ts` to expose new tools
- Use zod for input validation and schema generation

---

## Why This Works
- MCP is designed to be transport-agnostic: you can expose tools over stdio, HTTP, or any other channel.
- The minimal HTTP handler mimics the MCP JSON-RPC protocol, so you can test and integrate with any client.
- This project is a template for building your own MCP-compliant tool servers in TypeScript/Node.js.

---

## References
- [Model Context Protocol SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Official Quickstart](https://modelcontextprotocol.io/quickstart/server)
- [MCP Protocol Spec](https://modelcontextprotocol.io/llms-full.txt)

---

For more advanced usage, see the SDK and protocol documentation. Contributions and questions welcome!
