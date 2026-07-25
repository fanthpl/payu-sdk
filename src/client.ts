import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
    PayuOrderCreateRequest,
    PayuOrderCreateResponse,
    PayuOauthAuthorizeResponse,
    PayuPaymethodsResponse,
    PayuOrderTransactionsResponse,
} from "./types.js";
import crypto from "crypto";

export interface PayuConfig {
    posId: number; // POS ID (pos_id)
    secondKey: string; // Second key (MD5)
    clientId: number; // OAuth protocol - client_id
    clientSecret: string; // OAuth protocol - client_secret
    sandbox?: boolean; // Use sandbox environment (default: false)
}

export class PayuClient {
    private readonly api: AxiosInstance;
    private readonly config: PayuConfig;
    private readonly baseUrl: string;
    private accessTokenResponse: PayuOauthAuthorizeResponse | null = null;

    constructor(config: PayuConfig) {
        this.config = config;
        this.baseUrl = config.sandbox ? "https://secure.snd.payu.com" : "https://secure.payu.com";
        this.api = axios.create({
            baseURL: this.baseUrl,
        });
        this.api.interceptors.request.use(async (config) => {
            if (this.accessTokenResponse === null || Date.now() >= this.accessTokenResponse.expires_in * 1000) {
                // Generate new access token if we don't have one or if it's expired
                console.log({ message: "Generating new PayU access token" });
                this.accessTokenResponse = await this.getAccessToken();
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

    async getPaymentMethods(lang?: string): Promise<PayuPaymethodsResponse> {
        const response = await this.api.get<PayuPaymethodsResponse>("/api/v2_1/paymethods", {
            params: {
                lang,
            },
        });
        return response.data;
    }

    validateSignature(receivedBody: string, receivedSignature: string): boolean {
        const concatenated = receivedBody + this.config.secondKey;
        const calculatedSignature = this.calculateMD5(concatenated);
        return calculatedSignature === receivedSignature;
    }

    private calculateMD5(data: string): string {
        return crypto.createHash("md5").update(data).digest("hex");
    }
}
