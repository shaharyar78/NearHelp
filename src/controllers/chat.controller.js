import { supabase } from "../db/supabase.js";

export async function getConversations(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`user_one.eq.${req.user.id},user_two.eq.${req.user.id}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return res.json({ conversations: data });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req, res, next) {
  try {
    const conversationId = req.params.conversationId;

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`user_one.eq.${req.user.id},user_two.eq.${req.user.id}`)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const conversationId = req.params.conversationId;
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";

    if (!body) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`user_one.eq.${req.user.id},user_two.eq.${req.user.id}`)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: req.user.id,
        body,
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}
export async function createConversation(req, res, next) {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({ error: "Enter the other user's email address." });
    }

    const { data: recipient, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userError) throw userError;

    if (!recipient) {
      return res.status(404).json({ error: "No user was found with that email address." });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: "You cannot start a conversation with yourself." });
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_one: req.user.id,
        user_two: recipient.id,
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}
export async function getPublicMessages(req, res, next) {
  try {
    const { data: rows, error } = await supabase
      .from("public_chat_messages")
      .select("id, sender_id, body, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const messages = rows ?? [];
    const senderIds = [...new Set(messages.map((message) => message.sender_id))];
    let usersById = new Map();

    if (senderIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", senderIds);

      if (usersError) throw usersError;

      usersById = new Map((users ?? []).map((user) => [user.id, user.name]));
    }

    const result = messages.reverse().map((message) => ({
      ...message,
      sender_name: usersById.get(message.sender_id) || "User",
    }));

    return res.json({ messages: result });
  } catch (error) {
    next(error);
  }
}

export async function sendPublicMessage(req, res, next) {
  try {
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";

    if (!body || body.length > 2000) {
      return res.status(400).json({
        error: "Message must be between 1 and 2,000 characters.",
      });
    }

    const { data: message, error } = await supabase
      .from("public_chat_messages")
      .insert({
        sender_id: req.user.id,
        body,
      })
      .select("id, sender_id, body, created_at")
      .single();

    if (error) throw error;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", req.user.id)
      .single();

    if (userError) throw userError;

    return res.status(201).json({
      message: {
        ...message,
        sender_name: user.name || "User",
      },
    });
  } catch (error) {
    next(error);
  }
}
