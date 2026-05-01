import { apiClient } from "./client";

/** Returns every payment record visible to the current user. */
export async function getPayments() {
  const { data } = await apiClient.get("/payments");
  return data;
}

/**
 * Initiates a Paystack checkout. Returns the access_code + authorization_url
 * the frontend uses to launch the inline modal in production.
 */
export async function initiatePayment(payload) {
  const { data } = await apiClient.post("/paystack/initiate", payload);
  return data;
}

/** Verifies a completed Paystack transaction by reference. */
export async function verifyPayment(reference) {
  const { data } = await apiClient.post("/paystack/verify", { reference });
  return data;
}
