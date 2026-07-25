# @fanth/payu-sdk

TypeScript SDK for the [PayU REST API](https://developers.payu.com/europe/docs/).

## Install

```bash
npm install @fanth/payu-sdk
```

## Usage

```ts
import { PayuClient } from "@fanth/payu-sdk";

const client = new PayuClient({
    posId: 12345,
    secondKey: "...",
    clientId: 12345,
    clientSecret: "...",
    sandbox: true,
});

const order = await client.createOrder({
    customerIp: "127.0.0.1",
    description: "Order #1",
    currencyCode: "PLN",
    totalAmount: "1000",
    products: [{ name: "Product", unitPrice: "1000", quantity: "1" }],
});
```
