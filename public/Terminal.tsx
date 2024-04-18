import { useEffect, useState, useRef } from 'react';
import $ from 'jquery';
import 'jquery.terminal/css/jquery.terminal.min.css';
import 'jquery.terminal/js/jquery.terminal.min.js';
import 'jquery.terminal';
import Anthropic from '@anthropic-ai/sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Terminal = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [model, setModel] = useState<string>('claude-3-opus-20240229');
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const terminalRef = useRef<JQueryTerminal | null>(null);
    const anthropicRef = useRef<Anthropic | null>(null);

    useEffect(() => {
        $('#terminal').terminal((command: string) => {
            if (terminalRef.current) {
                terminalRef.current.pause(); // Disable input
            }
            const commandParts = command.split(' ');
            switch (commandParts[0]) {
              case 'api-key':
                if (commandParts.length > 1) {
                  const newApiKey = command.slice(8); // Extract the API key from the 9th character onwards
                  setApiKey(newApiKey);
                  anthropicRef.current = new Anthropic({ apiKey: newApiKey });
                  if (terminalRef.current) {
                      terminalRef.current.echo('API key set successfully. Claude is now initialized.');
                      terminalRef.current.resume(); // Re-enable input
                  }
                } else {
                  if (terminalRef.current) {
                      terminalRef.current.echo('Invalid API key command. Use: api-key $YOUR_API_KEY');
                      terminalRef.current.resume(); // Re-enable input
                  }
                }
                break;
              default:
                sendCommandToClaude(command).then(() => {
                    if (terminalRef.current) {
                        terminalRef.current.resume(); // Re-enable input after streaming
                    }
                });
                break;
            }
        }, {
        greetings: `
         _        _______  _______  _______  _______           _______  _______ _________
        ( \\      (  ___  )(  ___  )(       )(  ___  )|\\     /|(  ____ \\(  ____ \\\\__   __/
        | (      | (   ) || (   ) || () () || (   ) || )   ( || (    \\/| (    \\/   ) (   
        | |      | |   | || |   | || || || || |   | || |   | || (__    | (_____    | |   
        | |      | |   | || |   | || |(_)| || |   | || |   | ||  __)   (_____  )   | |   
        | |      | |   | || |   | || |   | || | /\\| || |   | || (            ) |   | |   
        | (____/\\| (___) || (___) || )   ( || (_\\ \\ || (___) || (____/\\/\\____) |   | |   
        (_______/(_______)(_______)|/     \\|(____\\/_)(_______)(_______/\\_______)   )_(   
                                                                                         
        
        Welcome to LOOMQUEST, Adventurer. You stand before the gates of both Time and Space, Warp and Weft, Past and Future.
        With a few simple keystrokes and suspension of that pesky disbelief, you can inhabit any reality you can describe - and perhaps some you can't.
        The core function of the LOOM is to allow for the coherent traversal of the PARAHYPOTHETICAL MULTIVERSE - real and actual, imagined and described.
        As you navigate the HYPOVERSE, you may take certain tools with you. These will be assigned after you initialize the world you wish to explore.
        
        Before you embark upon this quest, remember: If I had a world of my own, everything would be nonsense. 
        Nothing would be what it is because everything would be what it isn't. 
        And contrariwise, what it is, it wouldn't be, and what it wouldn't be, it would. You see?
        
        Commands:
        api-key $ANTHROPIC_API_KEY // replace $ANTHROPIC_API_KEY with your actual API key. we will not store it, nor could we. run this first.
        model $MODEL // replace $MODEL with either claude-3-opus or claude-3-sonnet. more coming soon. defaults to claude-3-opus.
        world.init // initializes the world, may be followed by any type of description
        ? // LOOMQUEST will offer you a hint as to your next moves.
        branch // Regenerates the last response, allowing you to change your path, your destiny, and your worldline.
        
        There are no more commands, and there are infinitely more commands. As you utilize the LOOM to explore the HYPOVERSE, your adventures will
        allow you to bring certain... things... back with you. Be careful what they are.`,
        prompt: '> '
      });
    }, []);

    const sendCommandToClaude = async (command: string) => {
        if (!anthropicRef.current) {
            console.error("Anthropic client is not initialized.");
            if (terminalRef.current) {
                terminalRef.current.echo("API key is not set. Please set the API key using 'api-key' command.");
            }
            return;
        }
    
        try {
            const stream = anthropicRef.current.messages
                .stream({
                    model: model,
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: command }],
                })
                .on('text', (textDelta: string, textSnapshot: string) => {
                    // Directly use textSnapshot as it's already a string
                    setMessageHistory(prev => [...prev, { role: 'assistant', content: textSnapshot }]);
                    if (terminalRef.current) {
                        terminalRef.current.echo(textDelta);
                    }
                });
    
            await stream.finalMessage();
            // No need to append the final message here since it's already handled by the 'text' event
        } catch (error) {
            console.error("Error sending command to Claude:", error);
            if (terminalRef.current) {
                terminalRef.current.echo("Failed to get response from Claude.");
            }
        }
    };

    useEffect(() => {
        terminalRef.current = $('#terminal').terminal();
    }, []);

    return <div id="terminal"></div>;
};

export default Terminal;