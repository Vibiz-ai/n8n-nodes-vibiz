import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export const VIBIZ_MCP_URL = 'https://mcp.vibiz.ai/mcp';
const PROTOCOL_VERSION = '2025-06-18';
const CREDENTIAL = 'vibizOAuth2Api';

interface JsonRpcMessage {
	jsonrpc: '2.0';
	id?: number | string;
	result?: IDataObject;
	error?: { code: number; message: string; data?: unknown };
}

/**
 * Minimal MCP (Streamable HTTP) client for the Vibiz server.
 * Uses only n8n helpers, so the package has no runtime dependencies.
 */
export class VibizMcpClient {
	private sessionId: string | undefined;

	private nextId = 1;

	constructor(private readonly ctx: IExecuteFunctions) {}

	private parseBody(raw: unknown, id: number): JsonRpcMessage | undefined {
		if (raw === undefined || raw === null || raw === '') return undefined;
		if (typeof raw === 'object') return raw as JsonRpcMessage;
		const text = String(raw).trim();
		if (text.startsWith('{')) return JSON.parse(text) as JsonRpcMessage;

		// Server-Sent Events: take the JSON-RPC message that answers our request id.
		let found: JsonRpcMessage | undefined;
		for (const event of text.split(/\r?\n\r?\n/)) {
			const data = event
				.split(/\r?\n/)
				.filter((line) => line.startsWith('data:'))
				.map((line) => line.slice(5).trim())
				.join('\n');
			if (!data) continue;
			try {
				const message = JSON.parse(data) as JsonRpcMessage;
				if (message.id === id) found = message;
			} catch {
				// ignore non-JSON events
			}
		}
		return found;
	}

	private async post(method: string, params: IDataObject, notification = false): Promise<JsonRpcMessage | undefined> {
		const id = this.nextId++;
		const payload: IDataObject = { jsonrpc: '2.0', method, params };
		if (!notification) payload.id = id;

		const headers: IDataObject = {
			'Content-Type': 'application/json',
			Accept: 'application/json, text/event-stream',
			'MCP-Protocol-Version': PROTOCOL_VERSION,
		};
		if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: VIBIZ_MCP_URL,
			headers,
			body: JSON.stringify(payload),
			json: false,
			returnFullResponse: true,
		};

		let response: IDataObject;
		try {
			response = (await this.ctx.helpers.httpRequestWithAuthentication.call(
				this.ctx,
				CREDENTIAL,
				options,
			)) as IDataObject;
		} catch (error) {
			throw new NodeApiError(this.ctx.getNode(), error as never, {
				message: `Vibiz request failed (${method})`,
			});
		}

		const responseHeaders = (response.headers ?? {}) as IDataObject;
		const session = responseHeaders['mcp-session-id'];
		if (typeof session === 'string' && session) this.sessionId = session;

		if (notification) return undefined;
		const message = this.parseBody(response.body, id);
		if (!message) {
			throw new NodeOperationError(this.ctx.getNode(), `Vibiz returned no answer for ${method}`);
		}
		if (message.error) {
			throw new NodeOperationError(this.ctx.getNode(), `Vibiz error: ${message.error.message}`, {
				description: `JSON-RPC code ${message.error.code}`,
			});
		}
		return message;
	}

	async connect(): Promise<void> {
		if (this.sessionId !== undefined) return;
		await this.post('initialize', {
			protocolVersion: PROTOCOL_VERSION,
			capabilities: {},
			clientInfo: { name: 'n8n-nodes-vibiz', version: '0.1.0' },
		});
		await this.post('notifications/initialized', {}, true);
		if (this.sessionId === undefined) this.sessionId = '';
	}

	/** Calls a Vibiz tool and returns structured content when present, otherwise the parsed text. */
	async callTool(name: string, args: IDataObject): Promise<IDataObject> {
		await this.connect();
		const message = await this.post('tools/call', { name, arguments: args });
		const result = (message?.result ?? {}) as IDataObject;
		const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
		const text = content
			.filter((part) => part.type === 'text' && part.text)
			.map((part) => part.text as string)
			.join('\n');

		if (result.isError === true) {
			throw new NodeOperationError(this.ctx.getNode(), text || `Vibiz tool ${name} failed`);
		}
		if (result.structuredContent && typeof result.structuredContent === 'object') {
			return { ...(result.structuredContent as IDataObject), ...(text ? { summary: text } : {}) };
		}
		try {
			const parsed = JSON.parse(text);
			if (parsed && typeof parsed === 'object') return Array.isArray(parsed) ? { items: parsed } : parsed;
		} catch {
			// plain text answer
		}
		return { text };
	}
}
