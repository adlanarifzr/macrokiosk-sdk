Macrokiosk (BOLD for SMS) unofficial SDK
======================================

This repository contains the open source Node.js client for Macrokiosk's API.

Installation
------------

`npm install @adlanarifzr/macrokiosk-sdk`

Usage
-----

Typescript with ES6 import (or .mjs with Node >= v13):

```typescript
import Macrokiosk, { MessageType, SendMessageOptions, SendMessageResult } from '@adlanarifzr/macrokiosk-sdk';
const macrokiosk = new Macrokiosk('<USERNAME>', '<PASSWORD>', '<SENDER_ID>', '<SERVICE_ID>');
```

Send message:

```typescript
// Options is optional
const options: SendMessageOptions = {
    type: MessageType.ASCII,
    showDetail: true,
};
const result: SendMessageResult = await macrokiosk.sendMessage(['<MOBILE_NUMBER>'], 'This is just a test', options);

// Result object:
{
  recipients: {
    '60123456789': {
      messageId: '24677783439',
      status: 200,
      description: 'Successful',
      currency: 'MYR',
      chargedAmount: 0.072
    }
  },
  remainingBalance: 0,
  totalRecipients: 1
}
```

Notes
-------------

Other than `MessageType.ASCII`, you would need to format/encode the message based on the documentation.
