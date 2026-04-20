export class ClientError extends Error {
	code: string;

	constructor(message: string, code = 'BUSINESS_RULE_VIOLATION') {
		super(message);
		this.code = code;
	}
}