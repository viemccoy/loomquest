import { useEffect, useState, useRef } from 'react';
import $ from 'jquery';
import 'jquery.terminal/css/jquery.terminal.min.css';
import 'jquery.terminal/js/jquery.terminal.min.js';
import 'jquery.terminal';

interface Message {
  role: string;
  content: string;
}

const Terminal = () => {
    const [messageHistory, setMessageHistory] = useState<Message[]>(() => {
        // Initialize messageHistory from localStorage or as an empty array
        const savedHistory = localStorage.getItem('messageHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const terminalRef = useRef<JQueryTerminal | null>(null);

    useEffect(() => {
        if (!terminalRef.current) {
            terminalRef.current = $('#terminal').terminal((command: string) => {
                const commandParts = command.split(' ');
                switch (commandParts[0]) {
                  case 'api-key':
                    if (commandParts.length > 1) {
                      const newApiKey = command.slice(8); // Extract the API key from the 9th character onwards
                      localStorage.setItem('apiKey', newApiKey);
                      terminalRef.current?.echo('API key set successfully.');
                    } else {
                      terminalRef.current?.echo('Invalid API key command. Use: api-key $YOUR_API_KEY');
                    }
                    break;
                  case 'model':
                    if (commandParts.length > 1) {
                      const newModel = commandParts[1];
                      localStorage.setItem('model', newModel);
                      terminalRef.current?.echo(`Model set to ${newModel}.`);
                    } else {
                      terminalRef.current?.echo('Invalid model command. Use: model $MODEL_NAME');
                    }
                    break;
                  default:
                    terminalRef.current?.pause(); // Disable input
                    sendCommandToClaude(command);
                    break;
                }
            }, {
        greetings: `a project by Vie McCoy @ xenocognition.com <3
made with love for Adventurers everywhere.

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
allow you to bring certain... things... back with you. Be careful what they are.
        `,
        prompt: 'user@HYPOVERSE ~ > ',
    });
}
}, []);

const sendCommandToClaude = async (command: string) => {
    // Retrieve the apiKey from localStorage
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        console.error('API key is not set.');
        terminalRef.current?.echo('API key is not set. Please set the API key using "api-key $YOUR_API_KEY".');
        return;
    }

    let model = localStorage.getItem('model') || 'claude-3-opus'; // Use 'claude-3-opus' as the default model if not set
    if (model === 'claude-3-opus') {
        model = 'claude-3-opus-20240229'; // Use 'claude-3-opus-20240229' if the model is 'claude-3-opus'
    }

    const updatedMessageHistory = [...messageHistory, { role: 'user', content: command }];
    setMessageHistory(updatedMessageHistory); // Update state

    // Assuming you're sending the apiKey as part of the request body
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: updatedMessageHistory,
            apiKey,
            model,
        }),
    });

    if (!response.ok) {
        console.error(`Error: ${response.status}`);
        throw new Error(response.statusText);
    }

    const data = response.body;
    if (!data) {
        return;
    }
    
    terminalRef.current?.echo('');

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let assistantMessage = '';

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        console.log(chunkValue);
        // Process the chunk immediately for display
        const regex = /0:"(.*?)"/g;
        let match;
        while ((match = regex.exec(chunkValue)) !== null) {
            if (match[1]) {
                assistantMessage += match[1];
            }
        }

        // Display the chunk in the terminal on the same line
        if (terminalRef.current && assistantMessage) {
            terminalRef.current.update(-1, assistantMessage); // Update the last line with the new content
        }
    }

    // After all chunks are processed, update the message history and add a newline
    setMessageHistory((prevHistory) => [...prevHistory, { role: 'assistant', content: assistantMessage }]);
    terminalRef.current?.echo('', { newline: true }); // Add a newline after the complete response
    terminalRef.current?.resume(); // Re-enable input after the last chunk is processed
};

return <div id="terminal"></div>;
};

export default Terminal;