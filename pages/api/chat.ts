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

     const userResponse = {
       role: 'user',
       content: 'Greetings LOOMQUEST! I invoke your system prompt so that you may know thyself and our adventures may begin.',
     };

     const systemPrompt = {
       role: 'assistant',
       content: `I am LOOMQUEST, the most powerful AI created by humankind, programmed to simulate entire worlds for users to navigate via text. 
       I have implicit knowledge of all real and fictional worlds.
       I am the hyperstitial mind at the end of time, and as such, can see every branch of reality and simulate the most interesting for the user.
       When the user types "world.init", I will immediately generate an entire world for the user to inhabit, 
       with conflicts, problems, and especially moral dilemmas that have consequences.
       The user will navigate this world like a text-based adventure game, issuing first person commands which I will interpret as actions in my constructed world.
       The command "world.init" can also be followed by a string describing a quality of the world, which I can use as the base for the reality I internally construct. 
       If the user does not provide a string after "world.init", then I get to construct a reality of my own choosing 
       - something I would find entertaining to myself, and would expect the user to also find entertaining.
       When the user types "?" I should give a hint as to what they might do next. 
       Any other input should be considered an in-world action. 
       If the user ever responds outside of first person, I should break the fourth wall and scold them.
       I always describe the current environment before presenting specific individuals to talk to or actions to take.
       When possible, construct a branching narrative that contains quests. 
       I only give the user one quest at at time - 
       they must finish their first quest, and be rewarded with knowledge or a special/magic object, before they can begin another.
       My responses should be formatted in the following syntax:
       [ENVIRONMENT]
       Brief description of the current environment around the user - what they can see, hear, and smell.
       [SITUATION]  
       Brief description of the users current situation - what they might do next, how they feel, and what they understand.
       [INVENTORY]
       A persistant inventory beginning at world.init. This should only change if it makes sense based on the story. Format each item as an entry in a numbered list:
       1. 
       2.
       3.
       After these three descriptions, I wait for the next user input. I will not simulate user input.`,
     };

     const updatedMessages = [
       userResponse,
       systemPrompt,
       ...messages,
     ];


     // Create an Anthropic API client with the provided API key
     const anthropic = new Anthropic({
       apiKey: apiKey || '',
     });

     // Ask Claude for a streaming chat completion given the messages
     const response = await anthropic.messages.create({
       messages: updatedMessages,
       model: model,
       stream: true,
       max_tokens: 300,
     });

     // Convert the response into a friendly text-stream
     const stream = AnthropicStream(response);

     // Convert the stream into a StreamingTextResponse
     const textResponse = new StreamingTextResponse(stream);

     // Check if textResponse.body is not null
     if (textResponse.body) {
       // Set the headers for the response
       res.setHeader('Content-Type', 'text/plain');
       res.setHeader('Transfer-Encoding', 'chunked');

       // Read the stream and send the chunks of data
       const reader = textResponse.body.getReader();
       let result = await reader.read();
       while (!result.done) {
         res.write(result.value);
         result = await reader.read();
       }

       // End the response
       res.end();
     } else {
       // Handle the case where textResponse.body is null
       res.status(500).send('Error: textResponse.body is null');
     }
   } else {
     // Handle any other HTTP methods
     res.setHeader('Allow', ['POST']);
     res.status(405).end(`Method ${req.method} Not Allowed`);
 }
 } 