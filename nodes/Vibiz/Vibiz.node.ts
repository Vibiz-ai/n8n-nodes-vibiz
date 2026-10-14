import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { VibizMcpClient } from './McpClient';

const PLATFORMS = [
	{ name: 'Google', value: 'google' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Meta (Facebook + Instagram)', value: 'meta' },
	{ name: 'Pinterest', value: 'pinterest' },
	{ name: 'TikTok', value: 'tiktok' },
	{ name: 'X (Twitter)', value: 'twitter' },
];

const show = (resource: string, operation: string[]) => ({
	displayOptions: { show: { resource: [resource], operation } },
});

const brandSlug = (resource: string, operation: string[], required = true): INodeProperties => ({
	displayName: 'Brand Slug',
	name: 'vibiz',
	type: 'string',
	default: '',
	required,
	placeholder: 'acme',
	description: 'Slug of the brand ("vibiz"). Get it with Brand → List.',
	...show(resource, operation),
});

const properties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Account', value: 'account' },
			{ name: 'Ad', value: 'ad' },
			{ name: 'Brand', value: 'brand' },
			{ name: 'Creative', value: 'creative' },
			{ name: 'Report', value: 'report' },
			{ name: 'Social', value: 'social' },
			{ name: 'Tool', value: 'tool' },
		],
		default: 'brand',
	},

	// ----- Brand -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['brand'] } },
		options: [
			{ name: 'Get Brand Kit', value: 'getKit', action: 'Get a brand kit', description: 'Colors, fonts, tone, audience, logo and headline' },
			{ name: 'Get Recommendations', value: 'recommendations', action: 'Get next best marketing actions' },
			{ name: 'List', value: 'list', action: 'List brands' },
			{ name: 'Onboard', value: 'onboard', action: 'Onboard a brand from its website', description: 'Create a brand from a website or Instagram URL' },
		],
		default: 'list',
	},
	{
		displayName: 'Search',
		name: 'query',
		type: 'string',
		default: '',
		description: 'Optional filter on brand name or website',
		...show('brand', ['list']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		...show('brand', ['list']),
	},
	brandSlug('brand', ['getKit', 'recommendations']),
	{
		displayName: 'Website or Instagram URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://acme.com',
		...show('brand', ['onboard']),
	},
	{
		displayName: 'Brand Name',
		name: 'workspaceName',
		type: 'string',
		default: '',
		description: 'Optional display name; defaults to the site name',
		...show('brand', ['onboard']),
	},

	// ----- Creative -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['creative'] } },
		options: [
			{ name: 'Create', value: 'create', action: 'Create ad creatives', description: 'Generate creatives. Spends Vibiz credits.' },
			{ name: 'Get Generation Status', value: 'status', action: 'Get a generation status' },
			{ name: 'List', value: 'list', action: 'List finished creatives' },
			{ name: 'Plan', value: 'plan', action: 'Estimate the credit cost of new creatives', description: 'Nothing is generated or spent' },
		],
		default: 'list',
	},
	brandSlug('creative', ['list', 'plan', 'create']),
	{
		displayName: 'Media Type',
		name: 'mediaType',
		type: 'options',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Image', value: 'image' },
			{ name: 'Video', value: 'video' },
		],
		default: 'any',
		...show('creative', ['list']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		...show('creative', ['list']),
	},
	{
		displayName: 'Only Favorites',
		name: 'onlyFavorites',
		type: 'boolean',
		default: false,
		...show('creative', ['list']),
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		options: [
			{ name: 'Carousel', value: 'carousel' },
			{ name: 'Image', value: 'image' },
			{ name: 'Product Shot', value: 'product_shot' },
			{ name: 'UGC (Creator-Style Video)', value: 'ugc' },
			{ name: 'Video', value: 'video' },
		],
		default: 'image',
		...show('creative', ['plan', 'create']),
	},
	{
		displayName: 'Brief',
		name: 'brief',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'Offer, angle, audience and must-say lines',
		...show('creative', ['plan', 'create']),
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 4 },
		default: 1,
		description: 'Number of variations (1-4)',
		...show('creative', ['plan', 'create']),
	},
	{
		displayName: 'Options',
		name: 'creativeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		...show('creative', ['plan', 'create']),
		options: [
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				options: [
					{ name: '4s', value: '4s' },
					{ name: '6s', value: '6s' },
					{ name: '8s', value: '8s' },
				],
				default: '8s',
				description: 'Video and UGC length',
			},
			{
				displayName: 'Placement',
				name: 'placement',
				type: 'string',
				default: '',
				placeholder: 'instagram_portrait',
				description: 'Where it runs, e.g. instagram_portrait, facebook_feed, tiktok_story, reels',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				options: [
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
					{ name: '1080p', value: '1080p' },
				],
				default: '720p',
				description: 'UGC render quality',
			},
			{
				displayName: 'Extra Fields (JSON)',
				name: 'extraFields',
				type: 'json',
				default: '{}',
				description: 'Product shots need {"productTitle": "...", "productImageUrl": "...", "recipeId": "..."}',
			},
		],
	},
	{
		displayName: 'Run ID',
		name: 'runId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'run_...',
		...show('creative', ['status']),
	},

	// ----- Report -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['report'] } },
		options: [{ name: 'Get Growth Report', value: 'growth', action: 'Get a growth report' }],
		default: 'growth',
	},
	brandSlug('report', ['growth']),
	{
		displayName: 'Range',
		name: 'range',
		type: 'options',
		options: [
			{ name: 'Last 7 Days', value: '7d' },
			{ name: 'Last 30 Days', value: '30d' },
			{ name: 'Last 90 Days', value: '90d' },
		],
		default: '7d',
		...show('report', ['growth']),
	},
	{
		displayName: 'Platforms',
		name: 'platforms',
		type: 'multiOptions',
		options: PLATFORMS,
		default: [],
		description: 'Leave empty for all connected platforms',
		...show('report', ['growth']),
	},

	// ----- Ad -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ad'] } },
		options: [
			{ name: 'Get Many Ads', value: 'listAds', action: 'Get many ads with metrics' },
			{ name: 'Get Many Campaigns', value: 'listCampaigns', action: 'Get many campaigns with metrics' },
		],
		default: 'listCampaigns',
	},
	brandSlug('ad', ['listCampaigns', 'listAds']),
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		options: PLATFORMS,
		default: 'meta',
		...show('ad', ['listCampaigns', 'listAds']),
	},
	{
		displayName: 'Filters',
		name: 'adFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		...show('ad', ['listCampaigns', 'listAds']),
		options: [
			{ displayName: 'From Date', name: 'fromDate', type: 'dateTime', default: '' },
			{
				displayName: 'Include External',
				name: 'includeExternal',
				type: 'boolean',
				default: false,
				description: 'Whether to include campaigns and ads created outside Vibiz',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Completed', value: 'completed' },
					{ name: 'Error', value: 'error' },
					{ name: 'Paused', value: 'paused' },
					{ name: 'Pending Review', value: 'pending_review' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'active',
			},
			{ displayName: 'To Date', name: 'toDate', type: 'dateTime', default: '' },
		],
	},

	// ----- Social -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['social'] } },
		options: [
			{ name: 'Get Many Accounts', value: 'listAccounts', action: 'Get many connected social accounts' },
			{ name: 'Get Many Posts', value: 'listPosts', action: 'Get many social posts' },
		],
		default: 'listPosts',
	},
	brandSlug('social', ['listAccounts', 'listPosts']),
	{
		displayName: 'Status',
		name: 'postStatus',
		type: 'options',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Draft', value: 'draft' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Published', value: 'published' },
			{ name: 'Scheduled', value: 'scheduled' },
		],
		default: '',
		...show('social', ['listPosts']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		...show('social', ['listPosts']),
	},

	// ----- Account -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{ name: 'Get Credits and Plan', value: 'billing', action: 'Get credits and plan' },
			{ name: 'Who Am I', value: 'whoami', action: 'Get the connected vibiz account' },
		],
		default: 'billing',
	},
	brandSlug('account', ['billing']),

	// ----- Tool (advanced) -----
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tool'] } },
		options: [{ name: 'Call', value: 'call', action: 'Call any vibiz tool', description: 'Advanced: call a Vibiz MCP tool by name' }],
		default: 'call',
	},
	{
		displayName: 'Tool Name',
		name: 'toolName',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'vibiz_find_capability',
		...show('tool', ['call']),
	},
	{
		displayName: 'Arguments (JSON)',
		name: 'toolArguments',
		type: 'json',
		default: '{}',
		...show('tool', ['call']),
	},
];

function toDate(value: unknown): string | undefined {
	if (!value) return undefined;
	return String(value).slice(0, 10);
}

function parseJson(ctx: IExecuteFunctions, value: unknown, field: string, itemIndex: number): IDataObject {
	if (value === undefined || value === null || value === '') return {};
	if (typeof value === 'object') return value as IDataObject;
	try {
		return JSON.parse(String(value)) as IDataObject;
	} catch {
		throw new NodeOperationError(ctx.getNode(), `${field} must be valid JSON`, { itemIndex });
	}
}

function compact(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
		out[key] = value;
	}
	return out;
}

export class Vibiz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vibiz',
		name: 'vibiz',
		icon: 'file:vibiz.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'AI marketing team: brand kits, ad creatives, UGC videos, ad and social performance',
		defaults: { name: 'Vibiz' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'vibizOAuth2Api', required: true }],
		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const client = new VibizMcpClient(this);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const slug = (): string => this.getNodeParameter('vibiz', i) as string;
				let tool = '';
				let args: IDataObject = {};

				if (resource === 'brand') {
					if (operation === 'list') {
						tool = 'list_vibiz';
						args = { query: this.getNodeParameter('query', i), limit: this.getNodeParameter('limit', i) };
					} else if (operation === 'getKit') {
						tool = 'vibiz_get_branding';
						args = { target: { vibiz: slug() } };
					} else if (operation === 'recommendations') {
						tool = 'vibiz_get_recommendations';
						args = { target: { vibiz: slug() } };
					} else if (operation === 'onboard') {
						tool = 'vibiz_onboard_brand';
						args = { url: this.getNodeParameter('url', i), workspace_name: this.getNodeParameter('workspaceName', i) };
					}
				} else if (resource === 'creative') {
					if (operation === 'list') {
						tool = 'vibiz_list_creatives';
						args = {
							target: { vibiz: slug() },
							mediaType: this.getNodeParameter('mediaType', i),
							limit: this.getNodeParameter('limit', i),
							onlyFavorites: this.getNodeParameter('onlyFavorites', i),
						};
					} else if (operation === 'plan' || operation === 'create') {
						tool = operation === 'plan' ? 'vibiz_plan_ad_creative' : 'vibiz_create_ad_creative';
						const options = this.getNodeParameter('creativeOptions', i, {}) as IDataObject;
						const extra = parseJson(this, options.extraFields, 'Extra Fields', i);
						args = {
							vibiz: slug(),
							format: this.getNodeParameter('format', i),
							brief: this.getNodeParameter('brief', i),
							count: this.getNodeParameter('count', i),
							duration: options.duration,
							placement: options.placement,
							resolution: options.resolution,
							extra_fields: Object.keys(extra).length ? extra : undefined,
						};
					} else if (operation === 'status') {
						tool = 'vibiz_generation_status';
						args = { runId: this.getNodeParameter('runId', i) };
					}
				} else if (resource === 'report') {
					tool = 'vibiz_growth_report';
					args = {
						vibiz: slug(),
						range: this.getNodeParameter('range', i),
						platforms: this.getNodeParameter('platforms', i),
					};
				} else if (resource === 'ad') {
					const filters = this.getNodeParameter('adFilters', i, {}) as IDataObject;
					tool = operation === 'listAds' ? 'vibiz_ads_creatives' : 'vibiz_ads_campaigns';
					args = {
						vibiz: slug(),
						platform: this.getNodeParameter('platform', i),
						action: 'list',
						fromDate: toDate(filters.fromDate),
						toDate: toDate(filters.toDate),
						status: filters.status,
						includeExternal: filters.includeExternal,
						limit: filters.limit,
					};
				} else if (resource === 'social') {
					if (operation === 'listAccounts') {
						tool = 'vibiz_social_list_accounts';
						args = { target: { vibiz: slug() } };
					} else {
						tool = 'vibiz_social_list_posts';
						args = {
							target: { vibiz: slug() },
							status: this.getNodeParameter('postStatus', i),
							limit: this.getNodeParameter('limit', i),
						};
					}
				} else if (resource === 'account') {
					if (operation === 'billing') {
						tool = 'vibiz_billing';
						args = { vibiz: slug() };
					} else {
						tool = 'vibiz_whoami';
					}
				} else if (resource === 'tool') {
					tool = (this.getNodeParameter('toolName', i) as string).trim();
					args = parseJson(this, this.getNodeParameter('toolArguments', i), 'Arguments', i);
				}

				if (!tool) {
					throw new NodeOperationError(this.getNode(), `Unsupported operation "${operation}" for "${resource}"`, { itemIndex: i });
				}

				const result = await client.callTool(tool, compact(args));
				returnData.push({ json: result, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
