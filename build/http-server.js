"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_js_1 = require("./index.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
const toolHandlers = {
    "get-alerts": (_a) => __awaiter(void 0, [_a], void 0, function* ({ state }) {
        var _b, _c;
        // @ts-ignore
        return yield ((_c = (_b = index_js_1.server.tool_implementations) === null || _b === void 0 ? void 0 : _b["getAlerts"]) === null || _c === void 0 ? void 0 : _c.call(_b, { state }));
    }),
    "get-forecast": (_a) => __awaiter(void 0, [_a], void 0, function* ({ latitude, longitude }) {
        var _b, _c;
        // @ts-ignore
        return yield ((_c = (_b = index_js_1.server.tool_implementations) === null || _b === void 0 ? void 0 : _b["getForecast"]) === null || _c === void 0 ? void 0 : _c.call(_b, { latitude, longitude }));
    }),
};
// @ts-ignore
app.post("/mcp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                const result = yield handler(args || {});
                return res.json({
                    jsonrpc: "2.0",
                    id: body.id,
                    result: { content: [{ type: "text", text: String(result) }] },
                });
            }
            catch (err) {
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
    }
    catch (err) {
        return res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: String(err) },
            id: null,
        });
    }
}));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Minimal MCP HTTP server listening at http://localhost:${PORT}/mcp`);
});
