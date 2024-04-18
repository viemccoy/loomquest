import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicStream, StreamingTextResponse } from 'ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Received ${req.method} request with body: ${JSON.stringify(req.body)}`);
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', ['POST']);
    res.setHeader('Access-Control-Allow-Headers', ['Content-Type']);
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    const { messages, apiKey, model } = req.body;

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
    res.status(200).send(stream);
  } else {
    // Handle any other HTTP methods
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}