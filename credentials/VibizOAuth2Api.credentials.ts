import type { ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class VibizOAuth2Api implements ICredentialType {
	name = 'vibizOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Vibiz OAuth2 API';

	documentationUrl = 'https://www.vibiz.ai/docs/mcp';

	icon: Icon = {
		light: 'file:../nodes/Vibiz/vibiz.svg',
		dark: 'file:../nodes/Vibiz/vibiz.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'pkce',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://secure-egg-74.authkit.app/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://secure-egg-74.authkit.app/oauth2/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'openid profile email offline_access',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'string',
			default: 'resource=https://mcp.vibiz.ai/mcp',
			description:
				'Extra parameters sent to the Vibiz sign-in page. Keep the default unless Vibiz support tells you otherwise.',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
