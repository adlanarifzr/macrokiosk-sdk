import axios from 'axios';

export enum MessageType {
	ASCII = 0,
	UNICODE = 5,
	UDH = 6,
};

export enum MessageStatus {
	DELIVERED = 'DELIVERED',
	UNDELIVERED = 'UNDELIVERED',
	ACCEPTED = 'ACCEPTED',
	PROCESSING = 'PROCESSING',
};

export type DeliveryNotificationPayload = {
	msgid: string;
	msisdn: string;
	status: MessageStatus;
	statusDetail?: string;
};

export type SendMessageOptions = {
	type?: MessageType;
	broadcastTitle?: string;
	showDetail?: boolean;
	extras?: Record<string, any>;
};

export type SendMessageResultRecipient = {
	messageId: string;
	status: number;
	description: string;
	currency?: string;
	chargedAmount?: number;
};

export type SendMessageResult = {
	recipients: Record<string, SendMessageResultRecipient>;
	remainingBalance?: number;
	totalRecipients?: number;
};

export default class Macrokiosk {
	private username: string;
	private password: string;
	private senderId: string;
	private serviceId: string;

    constructor(username: string, password: string, senderId: string, serviceId: string) {
		this.username = username;
		this.password = password;
		this.senderId = senderId;
		this.serviceId = serviceId;
	}

	sendMessage = async (to: string[], message: string, options?: SendMessageOptions) => {
		// Prepare the URL
		const url = new URL('https://www.etracker.cc/bulksms/mesapi.aspx');
		url.searchParams.append('user', this.username);
		url.searchParams.append('pass', this.password);
		url.searchParams.append('type', `${options?.type ?? MessageType.ASCII}`);
		url.searchParams.append('to', to.map(t => t.replace(/\+/g, '')).join(','));
		url.searchParams.append('from', this.senderId);
		url.searchParams.append('text', options?.type == MessageType.UNICODE ? this.stringToUCSText(message) : message);
		url.searchParams.append('servid', this.serviceId);
		url.searchParams.append('title', options?.broadcastTitle ?? '');
		url.searchParams.append('detail', options?.showDetail === false ? '0' : '1');

		// Add extra variable if needed
		Object.entries(options?.extras ?? {}).forEach(([key, value]) => {
			url.searchParams.append(key, `${value}`);
		});

		// Call the API
		const response = await axios.get(url.toString());
		const text = response.data;

		// Check if the response is an error
		if(!isNaN(text as any)) {
			throw new Error(this.getResponseMessage(parseInt(text)));
		}

		// Parse the text response
		const [part1, part2] = text.split('|=');
		const recipients = part1.split('|');
		const result: SendMessageResult = {
			recipients: {},
			remainingBalance: 0,
			totalRecipients: 0,
		};

		// Parse the status for each recipients
		for(const r of recipients) {
			const [recipient, messageId, status, currency, chargedAmount] = r.split(',');
			result.recipients[recipient] = {
				messageId,
				status: parseInt(status),
				description: this.getResponseMessage(parseInt(status)),
				currency,
				chargedAmount: !chargedAmount ? undefined : parseFloat(chargedAmount),
			};
		}

		const [remainingBalance, totalRecipients] = part2?.split(',');
		result.remainingBalance =  !remainingBalance ? undefined : parseFloat(remainingBalance);
		result.totalRecipients = !totalRecipients ? undefined : parseInt(totalRecipients);

		return result;
	}

	private getResponseMessage = (status: number) => {
		switch(status) {
			case 200: return 'Successful';
			case 400: return 'Missing parameter or invalid field type.';
			case 401: return 'Invalid Username, Password or ServID';
			case 402: return 'Insufficient Credit';
			case 403: return 'Invalid Client IP Address';
			case 404: return 'Invalid SenderID Length';
			case 405: return 'Invalid Message Type';
			case 406: return 'Invalid MSISDN length';
			case 407: return 'Message length allowed is exceeded.';
			case 408: return 'System Error';
			case 409: return 'System Error';
			case 411: return 'Blacklisted MSISDN / Subscriber has Opted-Out from receiving bulk promotional messages.';
			case 412: return 'Account Suspended / Terminated';
			case 413: return 'Broadcast is not allowed during this time.';
			case 414: return 'The account is inactive';
			case 415: return 'No active service';
			case 416: return 'The account has not been configured for this coverage.';
			case 417: return 'System Error';
			case 418: return 'System Error';
			case 419: return 'System Error';
			case 420: return 'System Error';
			case 421: return 'System Error';
			case 422: return 'Client has no active wallet.';
			case 423: return 'The wallet has insufficient balance.';
			case 424: return 'The reseller has not been configured for this coverage.';
			case 425: return 'System Error';
			case 427: return 'Broadcast title is invalid.';
			case 429: return 'Invalid Additional Parameter length / data type.';
			case 500: return 'Internal server error';
			default: return 'Unknown error';
		}
	}

	private stringToUCSText = (input: string) => {
		// Initialize an empty string to store the UCS representation
		let ucsText = '';
	  
		// Loop through each character in the input string
		for (let i = 0; i < input.length; i++) {
			// Get the Unicode code point for the current character
			const codePoint = input.charCodeAt(i);
		
			// Convert the code point to a hexadecimal string with leading zeros
			const hexString = codePoint.toString(16).toUpperCase().padStart(4, '0');
		
			// Append the hexadecimal representation to the result
			ucsText += hexString;
		}
	  
		return ucsText;
	}
}