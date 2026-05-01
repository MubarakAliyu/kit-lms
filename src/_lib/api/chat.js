import { apiClient } from "./client";

/**
 * Returns conversations sorted by recency. Pass a `userId` to fetch a
 * specific user's feed (e.g. the instructor's). Omitting it falls back to
 * the current user's feed on the backend.
 */
export async function getConversations(userId) {
  const url = userId ? `/conversations?user_id=${userId}` : "/conversations";
  const { data } = await apiClient.get(url);
  return data;
}

/** Returns the messages for a conversation, oldest → newest. */
export async function getMessages(conversationId) {
  const { data } = await apiClient.get(
    `/messages?conversation_id=${conversationId}`
  );
  return data;
}

/**
 * Sends a message. Returns the persisted message with `id` and
 * `created_at` populated.
 *
 * @param {{ sender_id: string, receiver_id: string, message: string,
 *   file_url?: string|null }} payload
 */
export async function sendMessage(payload) {
  const { data } = await apiClient.post("/messages", payload);
  return data;
}
