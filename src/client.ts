import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
    PayuOrderCreateRequest,
    PayuOrderCreateResponse,
    PayuOauthAuthorizeResponse,
    PayuPaymethodsRequest,
    PayuPaymethodsResponse,
    PayuOrderTransactionsResponse,
    PayuNotifyRequest,
} from "./types.js";
import crypto from "crypto";

export interface PayuConfig {
    posId: number; // POS ID (pos_id)
    secondKey: string; // Second key (MD5)
    clientId: number; // OAuth protocol - client_id
    clientSecret: string; // OAuth protocol - client_secret
    sandbox?: boolean; // Use sandbox environment (default: false)
}

const ACCESS_TOKEN_EXPIRY_MARGIN_SECONDS = 60;

export class PayuClient {
    private readonly api: AxiosInstance;
    private readonly config: PayuConfig;
    private readonly baseUrl: string;
    private accessTokenResponse: PayuOauthAuthorizeResponse | null = null;
    private accessTokenExpiresAt: number = 0; // Absolute timestamp (ms) at which the cached access token expires.

    constructor(config: PayuConfig) {
        this.config = config;
        this.baseUrl = config.sandbox ? "https://secure.snd.payu.com" : "https://secure.payu.com";
        this.api = axios.create({
            baseURL: this.baseUrl,
        });
        this.api.interceptors.request.use(async (config) => {
            if (this.accessTokenResponse === null || Date.now() >= this.accessTokenExpiresAt) {
                // Generate new access token if we don't have one or if it's expired
                console.log({ message: "Generating new PayU access token" });
                this.accessTokenResponse = await this.getAccessToken();
                this.accessTokenExpiresAt =
                    Date.now() + (this.accessTokenResponse.expires_in - ACCESS_TOKEN_EXPIRY_MARGIN_SECONDS) * 1000;
            }
            //console.log(this.accessTokenResponse);
            config.headers["Authorization"] = `Bearer ${this.accessTokenResponse.access_token}`;
            // this.api.defaults.headers.common["Authorization"] = `Bearer ${this.accessTokenResponse.access_token}`;
            return config;
        });
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error({ message: "PayU API error", errorResponse: error.response?.data });
                throw error;
            }
        );

        console.log({
            message: "PayU API initialized",
            baseUrl: this.baseUrl,
        });
    }

    async getAccessToken(): Promise<PayuOauthAuthorizeResponse> {
        const response = await axios.post<PayuOauthAuthorizeResponse>(
            this.baseUrl + "/pl/standard/user/oauth/authorize",
            {
                grant_type: "client_credentials",
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
            },
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return response.data;
    }

    async createOrder(data: Omit<PayuOrderCreateRequest, "merchantPosId">): Promise<PayuOrderCreateResponse> {
        if (this.accessTokenResponse === null || Date.now() >= this.accessTokenResponse.expires_in * 1000) {
            this.accessTokenResponse = await this.getAccessToken();
        }

        // We need to use here raw fetch because axios does not support cloudflare's "redirect" option
        const response = await fetch(`${this.baseUrl}/api/v2_1/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.accessTokenResponse.access_token}`,
            },
            body: JSON.stringify({
                ...data,
                merchantPosId: this.config.posId.toString(),
            }),
            redirect: "manual", // <-- this here is very important
        });

        // PayU returns 302 - on CF Workers with redirect: "manual" status is 0 (opaqueredirect)
        if (response.status !== 302 && response.status !== 0) {
            const errorText = await response.text();
            console.error({ message: "PayU API error", status: response.status, errorText });
            throw new Error(`Unexpected PayU response status: ${response.status}`);
        }

        return response.json() as Promise<PayuOrderCreateResponse>;
    }

    async getTransactions(orderId: string): Promise<PayuOrderTransactionsResponse> {
        const response = await this.api.get<PayuOrderTransactionsResponse>(`/api/v2_1/orders/${orderId}/transactions`);
        return response.data;
    }

    async getPayMethods(params?: PayuPaymethodsRequest): Promise<PayuPaymethodsResponse> {
        const response = await this.api.get<PayuPaymethodsResponse>("/api/v2_1/paymethods", {
            params,
        });
        return response.data;
    }

    /** Validates a PayU webhook notification (`notifyUrl` POST) and returns its typed body. Throws if the signature is missing or invalid. */
    async parseNotification(request: Request): Promise<PayuNotifyRequest> {
        const signatureHeader = request.headers.get("OpenPayu-Signature");
        if (!signatureHeader) {
            throw new Error("Missing OpenPayu-Signature header");
        }

        const receivedSignature = signatureHeader
            .split(";")
            .map((part) => part.trim().split("="))
            .find(([key]) => key === "signature")?.[1];
        if (!receivedSignature) {
            throw new Error("Missing signature in OpenPayu-Signature header");
        }

        const body = await request.text();
        if (!this.validateSignature(body, receivedSignature)) {
            throw new Error("Invalid PayU notification signature");
        }

        return JSON.parse(body) as PayuNotifyRequest;
    }

    private validateSignature(receivedBody: string, receivedSignature: string): boolean {
        const concatenated = receivedBody + this.config.secondKey;
        const calculatedSignature = this.calculateMD5(concatenated);
        return calculatedSignature === receivedSignature;
    }

    private calculateMD5(data: string): string {
        return crypto.createHash("md5").update(data).digest("hex");
    }
}

export interface PayuCustomerConfig {
    email: string;
    extCustomerId: string;
}

export class PayuTrustedMerchantClient {
    private readonly api: AxiosInstance;
    private readonly baseUrl: string;
    private accessTokenResponse: PayuOauthAuthorizeResponse | null = null;
    private accessTokenExpiresAt = 0; // Absolute timestamp (ms) at which the cached access token expires.

    constructor(
        private readonly config: PayuConfig,
        private readonly customer: PayuCustomerConfig
    ) {
        this.config = config;
        this.baseUrl = config.sandbox ? "https://secure.snd.payu.com" : "https://secure.payu.com";
        this.api = axios.create({
            baseURL: this.baseUrl,
        });
        this.api.interceptors.request.use(async (config) => {
            if (this.accessTokenResponse === null || Date.now() >= this.accessTokenExpiresAt) {
                // Generate new access token if we don't have one or if it's expired
                console.log({ message: "Generating new PayU access token" });
                this.accessTokenResponse = await this.getAccessToken();
                this.accessTokenExpiresAt =
                    Date.now() + (this.accessTokenResponse.expires_in - ACCESS_TOKEN_EXPIRY_MARGIN_SECONDS) * 1000;
            }
            //console.log(this.accessTokenResponse);
            config.headers["Authorization"] = `Bearer ${this.accessTokenResponse.access_token}`;
            // this.api.defaults.headers.common["Authorization"] = `Bearer ${this.accessTokenResponse.access_token}`;
            return config;
        });
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error({ message: "PayU API error", errorResponse: error.response?.data });
                throw error;
            }
        );

        console.log({
            message: "PayU API initialized",
            baseUrl: this.baseUrl,
        });
    }

    async getAccessToken(): Promise<PayuOauthAuthorizeResponse> {
        const response = await axios.post<PayuOauthAuthorizeResponse>(
            this.baseUrl + "/pl/standard/user/oauth/authorize",
            {
                grant_type: "trusted_merchant",
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                email: this.customer.email,
                // The OAuth endpoint takes snake_case, unlike the rest of the API
                ext_customer_id: this.customer.extCustomerId,
            },
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return response.data;
    }

    /**
     * Retrieves the payment methods available for the customer, including their saved
     * card and BLIK tokens.
     * GET /api/v2_1/paymethods
     */
    async getPayMethods(params: PayuPaymethodsRequest = {}): Promise<PayuPaymethodsResponse> {
        const response = await this.api.get<PayuPaymethodsResponse>("/api/v2_1/paymethods", {
            params,
        });

        return response.data;
    }

    /**
     * Deletes a saved token of the customer - call it when the customer removes the stored
     * card or terminates their account.
     * DELETE /api/v2_1/tokens/{token}
     */
    async deleteToken(token: string): Promise<void> {
        await this.api.delete(`/api/v2_1/tokens/${encodeURIComponent(token)}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
