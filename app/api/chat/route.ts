import Anthropic from '@anthropic-ai/sdk';
import { AnthropicStream, StreamingTextResponse } from 'ai';
 
export const runtime = 'edge';
 
export async function POST(req: Request) {
  const { messages, apiKey, model } = await req.json();
 
  // Create an Anthropic API client with the provided API key
  const anthropic = new Anthropic({
    apiKey: apiKey || '',
  });
 
  // Ask Claude for a streaming chat completion given the messages
  const response = await anthropic.messages.create({
    messages,
    model: model,
    stream: true,
    max_tokens: 300,
  });
 
  // Convert the response into a friendly text-stream
  const stream = AnthropicStream(response);
 
  // Respond with the stream
  return new StreamingTextResponse(stream);
}