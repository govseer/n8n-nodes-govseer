import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

const BASE_URL = 'https://govseer-api-823928849037.europe-west1.run.app';

const EU_LANGUAGES = [
	['Bulgarian', 'BG'],
	['Croatian', 'HR'],
	['Czech', 'CS'],
	['Danish', 'DA'],
	['Dutch', 'NL'],
	['English', 'EN'],
	['Estonian', 'ET'],
	['Finnish', 'FI'],
	['French', 'FR'],
	['German', 'DE'],
	['Greek', 'EL'],
	['Hungarian', 'HU'],
	['Irish', 'GA'],
	['Italian', 'IT'],
	['Latvian', 'LV'],
	['Lithuanian', 'LT'],
	['Maltese', 'MT'],
	['Polish', 'PL'],
	['Portuguese', 'PT'],
	['Romanian', 'RO'],
	['Slovak', 'SK'],
	['Slovenian', 'SL'],
	['Spanish', 'ES'],
	['Swedish', 'SV'],
].map(([name, value]) => ({ name, value }));

const UI_LANGUAGES = [
	['Dutch', 'NL'],
	['English', 'EN'],
	['French', 'FR'],
	['German', 'DE'],
	['Italian', 'IT'],
	['Polish', 'PL'],
	['Spanish', 'ES'],
].map(([name, value]) => ({ name, value }));

const SHEET_OPS = ['getLabel', 'getMarketplaceFields', 'getShippingFields', 'checkUsCanada'];

export class Govseer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Govseer',
		name: 'govseer',
		icon: { light: 'file:../../icons/govseer.svg', dark: 'file:../../icons/govseer.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Read a safety data sheet for its EU CLP label, marketplace and shipping fields, or check it against OSHA HCS and WHMIS',
		defaults: {
			name: 'Govseer',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'govseerApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Safety Data Sheet', value: 'sheet' },
					{ name: 'Rule Change', value: 'rule' },
				],
				default: 'sheet',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['sheet'] } },
				options: [
					{
						name: 'Check Against OSHA HCS and WHMIS',
						value: 'checkUsCanada',
						description: 'List what the sheet lacks under OSHA HCS 2024 and WHMIS, with the rule behind each gap',
						action: 'Check a sheet against OSHA HCS and WHMIS',
					},
					{
						name: 'Get EU Label',
						value: 'getLabel',
						description: 'Get the EU CLP label elements an online listing must show, in the official wording',
						action: 'Get the EU CLP label from a sheet',
					},
					{
						name: 'Get Marketplace Fields',
						value: 'getMarketplaceFields',
						description: 'Get the hazard fields bol.com, eBay and Amazon EU ask sellers for',
						action: 'Get marketplace hazard fields from a sheet',
					},
					{
						name: 'Get Shipping Fields',
						value: 'getShippingFields',
						description: 'Get the UN number, proper shipping name, class, packing group and US limited quantity rule',
						action: 'Get shipping fields from a sheet',
					},
				],
				default: 'getLabel',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['rule'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get dated rule changes ahead, each with its official source',
						action: 'Get many rule changes',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: { show: { resource: ['sheet'], operation: SHEET_OPS } },
				description: 'The binary field holding the safety data sheet (PDF)',
			},
			{
				displayName: 'Label Languages',
				name: 'labelLanguages',
				type: 'multiOptions',
				options: EU_LANGUAGES,
				default: ['EN'],
				displayOptions: { show: { resource: ['sheet'], operation: ['getLabel'] } },
				description: 'Languages of the label. The sheet itself may be in any EU language.',
			},
			{
				displayName: 'Sales Languages',
				name: 'salesLanguages',
				type: 'multiOptions',
				options: EU_LANGUAGES,
				default: ['EN'],
				displayOptions: { show: { resource: ['sheet'], operation: ['getMarketplaceFields'] } },
				description: 'The languages you sell in. Each marketplace answers in those it uses (bol.com always in Dutch and French).',
			},
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['sheet'], operation: ['getMarketplaceFields'] } },
				description: 'Leave empty to use the product name on the sheet',
			},
			{
				displayName: 'Nominal Quantity',
				name: 'quantity',
				type: 'string',
				default: '',
				placeholder: '500 ml',
				displayOptions: { show: { resource: ['sheet'], operation: ['getMarketplaceFields'] } },
			},
			{
				displayName: 'Rules',
				name: 'jurisdiction',
				type: 'options',
				options: [
					{ name: 'OSHA HCS and WHMIS', value: 'us,ca' },
					{ name: 'OSHA HCS Only (US)', value: 'us' },
					{ name: 'WHMIS Only (Canada)', value: 'ca' },
				],
				default: 'us,ca',
				displayOptions: { show: { resource: ['sheet'], operation: ['checkUsCanada'] } },
			},
			{
				displayName: 'Findings Language',
				name: 'ui',
				type: 'options',
				options: UI_LANGUAGES,
				default: 'EN',
				displayOptions: { show: { resource: ['sheet'], operation: ['getLabel', 'getMarketplaceFields'] } },
			},
			{
				displayName: 'Areas',
				name: 'products',
				type: 'multiOptions',
				options: [
					{ name: 'Amazon Dangerous Goods', value: 'amazon' },
					{ name: 'CPSC eFiling', value: 'cpsc' },
					{ name: 'EU CLP Hazard Labels', value: 'hazard-labels' },
					{ name: 'OSHA HCS and WHMIS', value: 'sds-gap' },
					{ name: 'Quebec French Labels', value: 'quebec-label' },
				],
				default: [],
				displayOptions: { show: { resource: ['rule'] } },
				description: 'Leave empty for all areas',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'options',
				options: UI_LANGUAGES,
				default: 'EN',
				displayOptions: { show: { resource: ['rule'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let options: IHttpRequestOptions;

				if (resource === 'rule') {
					const products = this.getNodeParameter('products', i, []) as string[];
					const qs: IDataObject = { lang: this.getNodeParameter('lang', i) as string };
					if (products.length) qs.products = products.join(',');
					options = { method: 'GET', url: `${BASE_URL}/api/v1/upcoming-rules`, qs, json: true };
				} else {
					const field = this.getNodeParameter('binaryPropertyName', i) as string;
					this.helpers.assertBinaryData(i, field);
					const pdf = await this.helpers.getBinaryDataBuffer(i, field);
					const qs: IDataObject = {};
					let path: string;
					if (operation === 'getLabel') {
						path = '/api/v1/check';
						const langs = this.getNodeParameter('labelLanguages', i) as string[];
						if (!langs.length) throw new NodeOperationError(this.getNode(), 'Choose at least one label language', { itemIndex: i });
						qs.langs = langs.join(',');
						qs.ui = this.getNodeParameter('ui', i) as string;
					} else if (operation === 'getMarketplaceFields') {
						path = '/api/v1/marketplace-fields';
						const langs = this.getNodeParameter('salesLanguages', i) as string[];
						if (langs.length) qs.langs = langs.join(',');
						const name = (this.getNodeParameter('productName', i, '') as string).trim();
						const quantity = (this.getNodeParameter('quantity', i, '') as string).trim();
						if (name) qs.name = name;
						if (quantity) qs.quantity = quantity;
						qs.ui = this.getNodeParameter('ui', i) as string;
					} else if (operation === 'getShippingFields') {
						path = '/api/v1/shipping-fields';
					} else {
						path = '/api/v1/sds-check';
						qs.jur = this.getNodeParameter('jurisdiction', i) as string;
					}
					options = {
						method: 'POST',
						url: `${BASE_URL}${path}`,
						qs,
						body: pdf,
						headers: { 'Content-Type': 'application/pdf' },
						json: false,
					};
				}

				const raw = await this.helpers.httpRequestWithAuthentication.call(this, 'govseerApi', options);
				const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
				const json = (typeof text === 'string' ? JSON.parse(text) : text) as IDataObject;
				out.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [out];
	}
}
