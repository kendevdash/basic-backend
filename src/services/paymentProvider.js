import crypto from "crypto";

const SUPPORTED_METHODS = ["mtn_momo", "visa_card", "bank_transfer"];

const METHOD_ALIASES = {
	momo: "mtn_momo",
	mtn: "mtn_momo",
	mtnmomo: "mtn_momo",
	card: "visa_card",
	visa: "visa_card",
	mastercard: "visa_card",
	flutterwave: "visa_card",
	paystack: "visa_card",
	bank: "bank_transfer",
	transfer: "bank_transfer"
};

export const normalizeMethod = raw => {
	if (!raw) return null;
	const val = String(raw).toLowerCase().trim();
	if (SUPPORTED_METHODS.includes(val)) return val;
	if (METHOD_ALIASES[val]) return METHOD_ALIASES[val];
	return null;
};

/**
 * Generate a unique reference with method prefix.
 */
const generateReference = method => `${method}-${crypto.randomUUID()}`;

/**
 * In a real integration, this would call a PSP (e.g., Flutterwave, Paystack) to obtain a checkout link.
 * Here we return a mock checkout URL while keeping the surface ready for swapping to a live gateway.
 */
export async function createPaymentSession({ amount, currency, method, userId, metadata = {}, provider }) {
	if (!SUPPORTED_METHODS.includes(method)) {
		throw new Error(`Unsupported payment method: ${method}`);
	}

	const reference = generateReference(method);
	const providerName = provider ? String(provider).toLowerCase().trim() : "mock-gateway";

	const flwSecret = process.env.FLW_SECRET_KEY || process.env.FLW_CLIENT_SECRET;
	const flwPublic = process.env.FLW_PUBLIC_KEY;

	// Try real Flutterwave init when keys are provided; otherwise fall back to mock
	if (flwSecret && flwPublic) {
		try {
			const checkoutBase = process.env.CLIENT_PAYMENT_RETURN_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000";
			const redirectUrl = `${checkoutBase.replace(/\/$/, "")}/checkout.html?ref=${encodeURIComponent(reference)}&status=flutterwave`;
			const paymentOptions = method === "mtn_momo"
				? "mobilemoneyghana"
				: method === "bank_transfer"
					? "banktransfer"
					: "card,mobilemoneyghana,banktransfer";

			const customerEmail = metadata.email || metadata.customerEmail || "user@example.com";
			const customerName = metadata.name || metadata.customerName || "IKPACE User";

			const resp = await fetch("https://api.flutterwave.com/v3/payments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${flwSecret}`
				},
				body: JSON.stringify({
					tx_ref: reference,
					amount,
					currency,
					redirect_url: redirectUrl,
					payment_options: paymentOptions,
					customer: { email: customerEmail, name: customerName },
					meta: { ...metadata, userId },
					customizations: {
						title: "IKPACE Subscription",
						description: metadata.plan ? `Payment for ${metadata.plan}` : "Payment"
					}
				})
			});

			if (!resp.ok) {
				const err = await resp.json().catch(() => ({}));
				throw new Error(err.message || "Flutterwave payment init failed");
			}
			const data = await resp.json();
			const checkoutUrl = data?.data?.link;
			if (!checkoutUrl) throw new Error("Missing checkout link from Flutterwave");

			return {
				reference,
				checkoutUrl,
				provider: "flutterwave",
				method,
				metadata: { ...metadata, userId }
			};
		} catch (err) {
			console.error("Flutterwave init failed, falling back to mock", err);
		}
	}

	// Mock fallback
	const checkoutBase = process.env.CLIENT_PAYMENT_RETURN_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000";
	// Use a static HTML with query param to avoid missing path issues on static hosting
	const mockCheckoutUrl = `${checkoutBase.replace(/\/$/, "")}/checkout.html?ref=${encodeURIComponent(reference)}`;

	return {
		reference,
		checkoutUrl: mockCheckoutUrl,
		provider: providerName,
		method,
		metadata: {
			...metadata,
			userId
		}
	};
}

export { SUPPORTED_METHODS };
