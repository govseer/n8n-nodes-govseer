import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GovseerApi implements ICredentialType {
	name = 'govseerApi';

	displayName = 'Govseer API';

	icon: Icon = { light: 'file:../icons/govseer.svg', dark: 'file:../icons/govseer.dark.svg' };

	documentationUrl = 'https://govseer.com/docs/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Create a key on your account page at govseer.com/account',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://govseer-api-823928849037.europe-west1.run.app',
			url: '/api/v1/cpsc/certificates',
			method: 'GET',
		},
	};
}
