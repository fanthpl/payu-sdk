export interface PayuOauthAuthorizeResponse {
    access_token: string;
    token_type: string;
    expires_in: number; // Seconds
    grant_type: string;
}

export interface PayuOrderCreateRequest {
    /** Address for redirecting the customer after payment is commenced. RFC 3986, max 1024. */
    continueUrl?: string;
    /** The address for sending notifications. RFC 3986, max 1024. */
    notifyUrl?: string;
    /** Payer's IP address (IPv4 or IPv6). Required. */
    customerIp: string;
    /** Point of sale ID. Required. */
    merchantPosId: string;
    /** Description of the order. Max 4000. Required. */
    description: string;
    /** Additional description of the order. Max 1024. */
    additionalDescription?: string;
    /** Order/payment description visible for the buyer on the PayU payment page. Max 80. */
    visibleDescription?: string;
    /** Recipient name + description shown on the card statement. Max 22. */
    statementDescription?: string;
    /** Order ID used in the merchant system. Must be unique within a single POS. Max 1024. */
    extOrderId?: string;
    /** Currency code compliant with ISO 4217 (e.g. "EUR"). Required. */
    currencyCode: string;
    /** Total price of the order in minor units (e.g. "1000" = 10.00 EUR). Required. */
    totalAmount: string;
    /** Order validity duration in seconds. Default 86400. */
    validityTime?: string;
    /** Party initializing order/transaction with buyer consent to save card token. Cannot be used with `recurring`. */
    cardOnFile?: "FIRST" | "STANDARD_CARDHOLDER" | "STANDARD_MERCHANT";
    /** Marks the order as a recurring payment. Cannot be used with `cardOnFile`. */
    recurring?: "FIRST" | "STANDARD";
    /** Hashed identifier of the user or its device. Max 255. */
    deviceFingerprint?: string;

    /** Data of a donation added to the order. */
    donation?: {
        /** Donation amount in minor units. */
        amount?: number;
        /** Charity identifier provided by PayU. */
        organizationId?: string;
    };

    /** Buyer data. */
    buyer?: {
        /** ID of the customer used in the merchant system. */
        extCustomerId?: string;
        /** Buyer's email. Required for Installments (PL), Pay Later (PL/CZ), 3DS 2. */
        email?: string;
        /** Buyer's phone in "+[country code] [number]" format. */
        phone?: string;
        firstName?: string;
        lastName?: string;
        /** National Identification Number. */
        nin?: string;
        /** Language code (ISO 639-1). */
        language?: string;
        /** Date of birth (ISO 8601). Required for AFT card authorization. */
        birthDate?: string;
        /** Delivery address. Recommended for 3DS 2. */
        delivery?: {
            /** Full street address, incl. apartment number. Max 255. */
            street?: string;
            postalBox?: string;
            postalCode?: string;
            city?: string;
            /** ISO 3166-2 subdivision code (e.g. "UT", "30"). */
            state?: string;
            /** Two-letter country code (ISO 3166). */
            countryCode?: string;
            /** Address description. */
            name?: string;
            recipientName?: string;
            recipientEmail?: string;
            recipientPhone?: string;
        };
    };

    /** Marketplace shopping carts (one per submerchant). */
    shoppingCarts?: Array<{
        /** Submerchant identifier. Max 1024. */
        extCustomerId: string;
        /** Total amount for the given submerchant. */
        amount: number;
        /** Marketplace fee. Should be in range <0, amount>. */
        fee?: string;
        shippingMethods?: Array<{
            /** Two-letter country code (ISO 3166). */
            country: string;
            price: number;
            name: string;
        }>;
        products: Array<{
            /** Name of the product. Max 255. */
            name: string;
            /** Unit price in minor units. */
            unitPrice: string;
            quantity: string;
            virtual?: boolean;
        }>;
    }>;

    /** Ordered products. Required. */
    products: Array<{
        /** Name of the product. Max 255. */
        name: string;
        /** Unit price in minor units. */
        unitPrice: string;
        /** Quantity of the given product. */
        quantity: string;
        /** Whether the product is virtual or material. */
        virtual?: boolean;
    }>;

    /** Allows directly invoking a payment method. */
    payMethods?: {
        payMethod?: {
            /** Payment method type. */
            type: "PBL" | "CARD_TOKEN" | "PAYMENT_WALL" | "BLIK_AUTHORIZATION_CODE" | "BLIK_TOKEN" | "TRANSPARENT";
            /** Payment type value (e.g. "c" for PBL, token value for CARD_TOKEN). */
            value: string;
            /** Click to Pay details. Provide exactly one of visa / mastercard. */
            clickToPay?:
                | { visa: { srcCorrelationId: string }; mastercard?: never }
                | {
                      mastercard: { srcCorrelationId: string; srcDigitalCardId: string };
                      visa?: never;
                  };
            /** e.g. 6-digit BLIK code collected on your website. */
            authorizationCode?: string;
            /** Card-based payments only. Default AUTHORIZATION. */
            authorizationType?: "PRE_AUTHORIZATION" | "AUTHORIZATION";
            /** Plain card data (transparent card payments). */
            card?: {
                number?: string;
                expirationMonth?: string;
                expirationYear?: string;
                cvv?: string;
                firstTransactionId?: string;
            };
            /** Additional data for some Visa Checkout integrations. */
            specificData?: Array<{ name?: string; value?: string }>;
            /** For marketplace: must equal `totalAmount`. */
            amount?: string;
            /** Additional data for BLIK with T6 or token. */
            blikData?: {
                /** Label proposal (token registration only). Required for BLIK Recurring. */
                aliasLabelProposal?: string;
                /** UID/PAYID token value (token registration only). */
                registerTokenValue?: string;
                /** `true` sends an alias registration request. */
                register?: boolean;
                /** Identifier of the customer's chosen bank mobile application. */
                appKey?: string;
                recommendedAuthLevel?: "NO_CONFIRMATION" | "REQUIRED_CONFIRMATION";
                /** Market where the BLIK payment is initiated. Default "PL". */
                countryCode?: "PL" | "SK";
                recurring?: {
                    /** Type of the recurring payment. Required for recurring. */
                    type: "O";
                    initializationDate?: string;
                    expirationDate?: string;
                    authorizeDespiteRecurringNotSupported?: boolean;
                };
            };
            /** Result data from the 3DS process. */
            threeDsData?: {
                /** 3DS status: "Y" (successful) or "A" (attempt). */
                status3Ds: "Y" | "A";
                /** Max 1024. */
                status3DsDescription?: string;
                /** 3DS v1 transaction identifier. Must not be sent for 3DS 2.x. */
                xid?: string;
                /** Required within 3DS 2.x. Must not be sent for 3DS v1. Max 36. */
                dsTransactionId: string;
                /** E-commerce Indicator / UCAF. */
                eciCode?: 0 | 1 | 2 | 5 | 6 | 7;
                /** 3DS cryptogram. Max 200. */
                cavv?: string;
                /** Token Authentication Verification Value from an external provider. */
                tavv?: string;
            };
            /** Digital wallet indicator. */
            sourcePaymentFlow?: "APPLE_PAY" | "CARDS" | "MDES" | "GOOGLE_PAY" | "VISA_MOBILE" | "VTS";
            /** Card installments (Romanian market only). */
            cardInstallments?: {
                /** Card installments program (e.g. "BRD_INSTALLMENTS"). */
                provider?: string;
                /** Selected number of installments. */
                number?: number;
            };
        };
    };

    /** Multi-Currency Pricing conversion details. */
    mcpData?: {
        /** termCurrency from the rate table. */
        mcpCurrency: string;
        /** baseCurrency amount converted to termCurrency. */
        mcpAmount: string;
        /** Applied conversion rate. */
        mcpRate: string;
        /** Applied FX rate table id. */
        mcpFxTableId: string;
        /** Id provided by PayU. */
        mcpPartnerId: string;
    };

    /** Optional fields required by the 3DS 2 authentication protocol. */
    threeDsAuthentication?: {
        /** Merchant's preference regarding the 3DS 2 challenge. Exclusive with `exemption`. */
        challengeRequested?: "YES" | "NO" | "MANDATE";
        /** SCA exemption preference. Exclusive with `challengeRequested`. */
        exemption?: {
            /** TRA (LOW_RISK) or low value payment (LOW_VALUE). */
            value: "LOW_RISK" | "LOW_VALUE";
            rejectionHandling: "PERFORM_AUTHENTICATION" | "DECLINE";
            /** Risk score from the merchant's antifraud tool. Max 128. */
            riskScore?: string;
        };
        /** Browser data for the 3DS 2 browser flow. */
        browser?: {
            acceptHeaders: string;
            /** IP address as returned by HTTP headers. */
            requestIP: string;
            /** screen.width in pixels. */
            screenWidth: string;
            javaEnabled: boolean;
            /** From Date.getTimezoneOffset(). */
            timezoneOffset: string;
            screenHeight: string;
            userAgent: string;
            /** screen.colorDepth. */
            colorDepth: string;
            /** navigator.language. Max 8 chars. */
            language: string;
        };
        /** 3DS 2 SDK data (native mobile app support). */
        sdk?: {
            sdkReferenceNumber: string;
            /** Max time (in minutes) for all exchanges. Must be >= 05. */
            sdkMaxTimeout: string;
            sdkAppID: string;
            /** Data encrypted by the 3DS SDK. */
            sdkEncData: string;
            sdkTransID: string;
            sdkEphemPubKey: {
                y?: string;
                x?: string;
                kty?: string;
                crv?: string;
            };
        };
        /** Risk indicators connected with the order. */
        merchantRiskIndicator?: {
            orderType?: "PURCHASE" | "ACC_FUNDING" | "LOAN";
            shipIndicator?:
                | "BILLING_ADDRESS"
                | "VERIFIED_ADDRESS"
                | "OTHER_ADDRESS"
                | "SHIP_TO_STORE"
                | "DIGITAL_GOODS"
                | "TICKETS"
                | "NOT_SHIPPED";
            preOrdered?: boolean;
            preOrderedDate?: string;
            deliveryTimeFrame?: "ELECTRONIC" | "SAME_DAY" | "OVERNIGHT" | "TWO_OR_MORE_DAYS";
            reordered?: boolean;
            /** Merchant's own funding used to partially pay for the order. */
            merchantFunds?: {
                /** Amount in minor units. */
                amount: string;
                /** Currency code (ISO 4217). */
                currencyCode: string;
            };
        };
        /** Recurring payment information. */
        recurring?: {
            /** Min number of days between recurring payments. */
            frequency?: string;
            /** Date after which no further recurring payments are performed. */
            expiry?: string;
        };
        /** Cardholder account data. */
        cardholder?: {
            /** Cardholder name and surname. */
            name?: string;
            accountInformation?: {
                createDate?: string;
                suspiciousActivity?: boolean;
                deliveryAddressFirstUsedDate?: string;
                deliveryAdressUsageIndicator?: "THIS_TRANSACTION" | "LESS_THAN_30_DAYS" | "30_TO_60_DAYS" | "MORE_THAN_60_DAYS";
                /** Orders for this account in the past 12 months. */
                pastOrdersYear?: number;
                /** Orders for this account in the last 24 hours. */
                pastOrdersDay?: number;
                /** Successful orders for this account in the past 6 months. */
                purchasesLastSixMonths?: number;
                changeDate?: string;
                changeIndicator?: "THIS_TRANSACTION" | "LESS_THAN_30_DAYS" | "30_TO_60_DAYS" | "MORE_THAN_60_DAYS";
                passwordChanged?: string;
                passwordChangeIndicator?:
                    "NO_CHANGE" | "THIS_TRANSACTION" | "LESS_THAN_30_DAYS" | "30_TO_60_DAYS" | "MORE_THAN_60_DAYS";
                nameToRecipientMatch?: boolean;
                /** Attempts to add a card within the last 24 hours. */
                addCardAttemptsDay?: string;
                authMethod?: "GUEST" | "LOGIN" | "FEDERATED_ID" | "THIRD_PARTY" | "ISSUER" | "FIDO";
                authDateTime?: string;
                cardAddedDate?: string;
                cardAddedIndicator?: "GUEST" | "THIS_TRANSACTION" | "LESS_THAN_30_DAYS" | "30_TO_60_DAYS" | "MORE_THAN_60_DAYS";
            };
            billingAddress?: {
                /** Full street address, incl. apartment number. Max 50. */
                street?: string;
                /** Postal/ZIP code. Max 16. */
                postalCode?: string;
                /** City name. Max 50. */
                city?: string;
                /** ISO 3166 subdivision/country code. Max 3. */
                state?: string;
                /** Two-letter country code (ISO 3166). */
                countryCode?: string;
            };
        };
    };

    /** Optional fields required for risk analysis. Required for BLIK with auth code or token. */
    riskData?: {
        /** Browser data. Required. */
        browser: {
            acceptHeaders: string;
            requestIP: string;
            screenWidth: string;
            javaEnabled: boolean;
            timezoneOffset: string;
            screenHeight: string;
            userAgent: string;
            colorDepth: string;
            language: string;
        };
    };

    /** Credit data (recommended for Installments / Pay later). */
    credit?: {
        shoppingCarts?: Array<{
            shippingMethod?: {
                type?: "COURIER" | "COLLECTION_POINT_PICKUP" | "PARCEL_LOCKER" | "STORE_PICKUP";
                price?: string;
                address?: {
                    /** Full name of the pickup point, incl. its unique identifier. */
                    pointId?: string;
                    street?: string;
                    streetNo?: string;
                    flatNo?: string;
                    postalCode?: string;
                    city?: string;
                    /** Two-letter country code (ISO 3166). */
                    countryCode?: string;
                };
            };
            products?: Array<{
                name?: string;
                unitPrice?: string;
                quantity?: string;
                virtual?: boolean;
                /** Marketplace date from which the product/offer is available (ISO). */
                listingDate?: string;
            }>;
            /** Submerchant identifier; should match `extCustomerId` in `shoppingCarts`. */
            extCustomerId?: string;
        }>;
        applicant?: {
            email?: string;
            phone?: string;
            firstName?: string;
            lastName?: string;
            /** Language code (ISO 639-1). */
            language?: string;
            /** National Identification Number. */
            nin?: string;
            address?: {
                street?: string;
                streetNo?: string;
                flatNo?: string;
                postalCode?: string;
                city?: string;
                /** Two-letter country code (ISO 3166). */
                countryCode?: string;
            };
            additionalInfo?: {
                /** Whether there were previous, successfully completed orders for the applicant. */
                hasSuccessfullyFinishedOrderInShop?: string;
            };
        };
        /** Extra merchant data mandatory in certain segments (Klarna). */
        klarnaAttachment?: {
            content_type?: string;
            body?: string;
        };
    };

    /** Submerchant data when payment is created by a Payment Facilitator. */
    submerchant?: {
        /** Submerchant ID. */
        id?: string;
    };

    /** Additional settings (e.g. card installments options). */
    settings?: {
        /** Allowed installment numbers per provider, e.g. { "OPTIMO": [1, 2, 3] }. Romanian market only. */
        cardInstallmentsOptions?: Record<string, number[]>;
    };
}

export interface PayuPaymethodsRequest {
    /** Language code, ISO-639-1 compliant, determines language of description in the `name` field. */
    lang?: string;
    /** Determines the availability and parameters of specific features, e.g. "clickToPay". */
    features?: string;
}

export interface PayuPaymethodsResponse {
    /** Section containing saved BLIK tokens. */
    blikTokens?: Array<{
        /** BLIK token value. */
        value?: string;
        /** Type of the token. Either UID for normal transactions or PAYID for recurring payments. */
        type?: "UID" | "PAYID";
        brandImageUrl?: string;
        /** Array containing objects about available installments options. */
        bankApplicationReferences?: Array<{
            /** Unique key for assignment of particular banking application to a token. Inserted in `payMethod.blikData.appKey`. */
            key?: string;
            /** Label presented to the customer when selecting a banking application for the UID token. */
            label?: string;
        }>;
        /** Contains information about the recurring payment. */
        recurring?: {
            /** BLIK recurring payment title. */
            aliasLabel?: string;
            /** Type of the recurring payment. */
            type?: "O";
            /** Date of the first transaction in the recurring payment cycle without customer confirmation. */
            initializationDate?: string;
            /** Expiration date of the PAYID token. Max 10 years from creation. Indefinite if not provided. */
            expirationDate?: string;
        };
    }>;

    /** Section containing saved card tokens. */
    cardTokens?: Array<{
        value?: string;
        brandImageUrl?: string;
        preferred?: boolean;
        status?: "NEW" | "ACTIVE" | "EXPIRED";
        cardExpirationYear?: number;
        cardExpirationMonth?: number;
        cardNumberMasked?: string;
        cardScheme?: string;
        cardBrand?: string;
    }>;

    /** Section containing available PayByLink payment methods. */
    payByLinks?: Array<{
        /** `payType` value. */
        value?: string;
        /** Link to `payType` logo graphic on PayU server. */
        brandImageUrl?: string;
        /** Name of `payType` set by PayU. */
        name?: string;
        status?: "ENABLED" | "DISABLED" | "TEMPORARY_DISABLED";
        minAmount?: number;
        maxAmount?: number;
        /** List of features available. */
        features?: {
            clickToPay?: {
                brandImageUrl?: string;
                /** Click to Pay Mastercard feature. */
                mastercard?: {
                    status?: "ENABLED" | "DISABLED";
                    /** Merchant ID in Mastercard Click to Pay. */
                    dpaId?: string;
                };
                /** Click to Pay Visa feature. */
                visa?: {
                    status?: "ENABLED" | "DISABLED";
                    /** Merchant ID in Visa Click to Pay. */
                    dpaId?: string;
                    /** Acquirer Bank Identification Number for Click to Pay transactions. */
                    acquirerBIN?: string;
                    /** Acquirer Merchant ID for Click to Pay transactions. */
                    acquirerMerchantId?: string;
                };
            };
        };
    }>;

    status?: {
        statusCode?: "SUCCESS";
    };
}

/** Response is `oneOf` card/pbl/blik/wire depending on the payment method used; fields merged here since the shape depends on the chosen `paymentFlow`. */
export interface PayuOrderTransactionsResponse {
    transactions?: Array<{
        payMethod?: {
            /** Payment method code, e.g. "c" (card), "m" (PBL), "blik", "bt" (wire). */
            value?: string;
        };
        /** Payment flow. Absent for wire transfer transactions. */
        paymentFlow?:
            | "APPLE_PAY"
            | "CARD"
            | "CARD_INSTALLMENTS"
            | "CLICK_TO_PAY"
            | "FIRST_ONE_CLICK_CARD"
            | "GOOGLE_PAY"
            | "GOOGLE_PAY_TOKENIZED"
            | "VISA_MOBILE"
            | "ONE_CLICK_CARD"
            | "ONE_CLICK_CARD_RECURRING"
            | "ONE_CLICK_MAIL_ORDER"
            | "ONE_CLICK_MAIL_RECURRING"
            | "ONE_CLICK_PHONE_ORDER"
            | "ONE_CLICK_PHONE_RECURRING"
            | "PBL"
            | "PEX_BANK"
            | "BLIK_PBL"
            | "BLIK_AUTHORIZATION_CODE"
            | "BLIK_AUTHORIZATION_CODE_WITH_UID_TOKEN_REGISTERING"
            | "BLIK_UID_TOKEN"
            | "BLIK_AUTHORIZATION_CODE_WITH_PAYID_TOKEN_TYPE_O_REGISTERING"
            | "BLIK_PAYID_TOKEN_TYPE_O";
        /** Transaction capture expiration date. Card and wire transfer only. */
        validUntil?: string;
        /** Transaction handling result code. */
        resultCode?: "AUT_ERROR_NO_AUTHORIZATION" | "AUT_ERROR_ANTIFRAUD_DECLINED" | "REG_ERROR_ANTIFRAUD_DECLINED" | string;
        /** Chosen payment method details. Card transactions only. */
        card?: {
            cardData?: {
                /** Masked card number (real number or token, e.g. for Apple Pay / Google Pay Tokenized). */
                cardNumberMasked?: string;
                /** Payment organization: MC (MasterCard/Maestro), VS (Visa). */
                cardScheme?: string;
                /** Card profile (CONSUMER or BUSINESS). */
                cardProfile?: string;
                /** Card classification (CREDIT/DEBIT). */
                cardClassification?: string;
                cardResponseCode?: string;
                cardResponseCodeDesc?: string;
                /** Electronic Commerce Indicator. */
                cardEciCode?: string;
                /** 3DS verification status. */
                card3DsStatus?: string;
                /** Whether the authentication was frictionless or with challenge. */
                card3DsFrictionlessIndicator?: string;
                card3DsStatusDescription?: string;
                /** Country in which the card was issued (ISO 3166 two-letter code). */
                cardBinCountry?: string;
                /** Identifier of the first of recurring payments or Card-on-File, granted by the payment organisation. */
                firstTransactionId?: string;
            };
        };
        /** Bank transfer account used for payment. PBL transactions only. */
        bankAccount?: {
            /** Bank account number from which payment was made. */
            number?: string;
            /** Name (or full data) of the account holder from which payment was made. */
            name?: string;
            city?: string;
            postalCode?: string;
            street?: string;
            address?: string;
        };
        /** BLIK transactions only. */
        blik?: {
            /** The transaction identifier assigned by the BLIK system. */
            txRef?: string;
            /** Transaction identifier assigned by PayU. */
            extTxRef?: string;
        };
        /** Wire transfer transactions only. */
        wireTransfer?: {
            title?: string;
            /** Bank sort code. */
            sortCode?: string;
            bankAccountNumber?: string;
            ownerName?: string;
            ownerAddress?: string;
            bankName?: string;
            swiftCode?: string;
            specificSymbol?: string;
            variableSymbol?: string;
        };
    }>;
}

export interface PayuNotifyProduct {
    name: string;
    unitPrice: string;
    quantity: string;
    /** Not returned by PayU even if sent when the order was created. */
    virtual?: boolean;
}

export interface PayuNotifyShoppingCart {
    extCustomerId: string;
    amount: number;
    fee?: string;
    shippingMethods?: Array<{ country: string; price: string; name: string }>;
    products: PayuNotifyProduct[];
}

interface PayuNotifyOrderBase {
    shippingMethod?: { country?: string; price?: string; name?: string };
    orderId?: string;
    extOrderId?: string;
    orderCreateDate?: string;
    notifyUrl?: string;
    customerIp?: string;
    merchantPosId?: string;
    description?: string;
    additionalDescription?: string;
    validityTime?: string;
    currencyCode?: string;
    totalAmount?: string;
    capturedAmount?: string;
    buyer?: {
        extCustomerId?: string;
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        nin?: string;
    };
    payMethod?: { amount?: string; type?: "PBL" | "CARD_TOKEN" | "INSTALLMENTS" };
    products?: PayuNotifyProduct[];
    shoppingCarts?: PayuNotifyShoppingCart[];
    merchantFunds?: Array<{ type?: "COUPON"; value?: string; amount?: string }>;
    status?: "NEW" | "PENDING" | "WAITING_FOR_CONFIRMATION" | "COMPLETED" | "CANCELED";
}

export interface PayuNotifyOrder extends PayuNotifyOrderBase {}

export interface PayuNotifyEnrichedOrder extends PayuNotifyOrderBase {
    /** URL of the payment page for this order. */
    orderUrl?: string;
    authorization?: {
        amount?: string;
        currencyCode?: string;
        serviceProcessingType?: "PSP" | "TSP";
        status?: "AUTHORIZED" | "SOFT_DECLINED" | "REJECTED" | "PENDING";
        createDate?: string;
        resultDate?: string;
        validUntil?: string;
        payType?: string;
        paymentFlow?: string;
        /** Shape depends on payType (card/blik/paypal); left untyped. */
        payTypeDetails?: Record<string, unknown>;
    };
    capture?: {
        amount?: string;
        currencyCode?: string;
        date?: string;
        /** Shape depends on payType (card/paypal); left untyped. */
        payTypeDetails?: Record<string, unknown>;
    };
    fees?: Array<{ amount?: string; currencyCode?: string; type?: string }>;
    mcpData?: { amount?: string; currencyCode?: string; rate?: string };
}

export interface PayuNotifyProperty {
    name?: string;
    value?: string;
}

export interface PayuNotifyRefund {
    orderId: string;
    extOrderId?: string;
    refund: {
        refundId?: string;
        extRefundId?: string;
        amount?: string;
        currencyCode?: string;
        status?: "FINALIZED" | "CANCELLED";
        statusDateTime?: string;
        reason?: string;
        reasonDescription?: string;
        refundDate?: string;
    };
}

/** Body of a PayU webhook notification (POST to your `notifyUrl`). */
export type PayuNotifyRequest =
    | { order: PayuNotifyOrder; properties?: PayuNotifyProperty[] }
    | { order: PayuNotifyEnrichedOrder; properties?: PayuNotifyProperty[] }
    | PayuNotifyRefund;

export interface PayuOrderCreateResponse {
    status?: {
        /** Response/status code, e.g. "SUCCESS". */
        statusCode?: string;
        severity?: string;
    };
    /** URL the buyer should be redirected to (payment page or summary). */
    redirectUri?: string;
    /** Base64-encoded QR code image. Returned only for the transparent QR code payment type. */
    qrCode?: string;
    /** Order identifier assigned by PayU. */
    orderId?: string;
    /** Order identifier assigned by the merchant. */
    extOrderId?: string;
    iframeAllowed?: boolean;
    threeDsProtocolVersion?: "3DS2";
    /** 3DS challenge parameters (present when a challenge is required). */
    challengeParameters?: {
        threeDsServerTransactionId?: string;
        acsTransID?: string;
        acsReferenceNumber?: string;
        acsSignedContent?: string;
    };
    /** Returned in the 302 flow, e.g. with a generated card token. */
    payMethods?: {
        payMethod?: {
            card?: {
                number?: string;
                expirationMonth?: number;
                expirationYear?: number;
            };
            type?: "CARD_TOKEN";
            /** Token value, e.g. "TOKC_...". */
            value?: string;
        };
    };
}
