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

### Webhook notifications

Use `parseNotification` to verify and parse PayU webhook calls to your `notifyUrl`. It checks the `OpenPayu-Signature` header against the raw body and throws if the signature is missing or invalid.

```ts
// e.g. a Next.js route handler / any Request-based HTTP framework
export async function POST(request: Request) {
    const notification = await client.parseNotification(request);

    if ("order" in notification && notification.order.status === "COMPLETED") {
        // mark the order as paid
    }

    return new Response(null, { status: 200 });
}
```

> Note: `parseNotification` reads the body via `request.text()`, so pass it the raw `Request` before any other code consumes the body.

> Note: Not all endpoints are implemented yet. If you need an endpoint that is not implemented, feel free to open up a pull request :)
