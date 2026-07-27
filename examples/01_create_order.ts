import "dotenv/config";
import { PayuClient } from "@fanth/payu-sdk";

const client = new PayuClient({
    posId: parseInt(process.env.PAYU_POS_ID!),
    secondKey: process.env.PAYU_SECOND_KEY!,
    clientId: parseInt(process.env.PAYU_CLIENT_ID!),
    clientSecret: process.env.PAYU_CLIENT_SECRET!,
    sandbox: process.env.PAYU_IS_SANDBOX === "true",
});

const order = await client.createOrder({
    customerIp: "127.0.0.1",
    description: "Test order",
    currencyCode: "PLN",
    totalAmount: "1000", // 10.00 PLN
    products: [{ name: "Some product", unitPrice: "1000", quantity: "1" }],
});

console.log(order);
