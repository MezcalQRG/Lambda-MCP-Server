import express from "express";
import { server } from "./index.js";

const app = express();
app.use(express.json());

// Directly access tool schemas and handlers from your MCP server instance
const getTools = () => {
  // Manually define the tool schemas as in your index.ts
  return [
    {
      name: "get-alerts",
      description: "Get weather alerts for a state",
      inputSchema: {
        type: "object",
        properties: { state: { type: "string", description: "Two-letter state code (e.g. CA, NY)" } },
        required: ["state"],
      },
    },
    {
      name: "get-forecast",
      description: "Get weather forecast for a location",
      inputSchema: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "Latitude of the location" },
          longitude: { type: "number", description: "Longitude of the location" },
        },
        required: ["latitude", "longitude"],
      },
    },
  ];
};

const toolHandlers: Record<string, Function> = {
  "get-alerts": async ({ state }: { state: string }) => {
    // @ts-ignore
    return await server.tool_implementations?.["getAlerts"]?.({ state });
  },
  "get-forecast": async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    // @ts-ignore
    return await server.tool_implementations?.["getForecast"]?.({ latitude, longitude });
  },
};

// @ts-ignore
app.post("/mcp", async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      });
    }
    if (body.method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        id: body.id,
        result: { tools: getTools() },
      });
    }
    if (body.method === "tools/call") {
      const { name, arguments: args } = body.params || {};
      const handler = toolHandlers[name];
      if (!handler) {
        return res.status(404).json({
          jsonrpc: "2.0",
          error: { code: -32601, message: `Tool '${name}' not found` },
          id: body.id,
        });
      }
      try {
        const result = await handler(args || {});
        return res.json({
          jsonrpc: "2.0",
          id: body.id,
          result: { content: [{ type: "text", text: String(result) }] },
        });
      } catch (err) {
        return res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: String(err) },
          id: body.id,
        });
      }
    }
    return res.status(404).json({
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not found: ${body.method}` },
      id: body.id,
    });
  } catch (err) {
    return res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message: String(err) },
      id: null,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Minimal MCP HTTP server listening at http://localhost:${PORT}/mcp`);
});
