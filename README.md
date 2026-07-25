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

### Trusted merchant (tokenized payments)

Use `PayuTrustedMerchantClient` to charge a returning customer's saved card/BLIK token without them re-entering payment details.

```ts
import { PayuTrustedMerchantClient } from "@fanth/payu-sdk";

const client = new PayuTrustedMerchantClient(
    {
        posId: 12345,
        secondKey: "...",
        clientId: 12345,
        clientSecret: "...",
        sandbox: true,
    },
    {
        email: "customer@example.com",
        extCustomerId: "customer-123",
    }
);

const { cardTokens } = await client.getPayMethods();

// Remove a saved token, e.g. when the customer deletes their account
const token = cardTokens?.[0]?.value;
if (token) await client.deleteToken(token);
```

> Note: Not all endpoints are implemented yet. If you need an endpoint that is not implemented, feel free to open up a pull request :)
