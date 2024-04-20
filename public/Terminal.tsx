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
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const terminalRef = useRef<JQueryTerminal | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
      terminalContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };


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
              case 'reset':
          setMessageHistory([]); // Clear the message history
          terminalRef.current?.resume();
          break;
          default:
            terminalRef.current?.pause(); // Disable input
            setMessageHistory((prevMessageHistory) => [
              ...prevMessageHistory,
              { role: 'user', content: command },
            ]);
          break;
          }
        }, {
        greetings: `LOOMQUEST v.0.1.5 - a project by Vie McCoy @ xenocognition.com <3
made with love for Adventurers, Explorers, and Cartographers of the Collective Unconscious.

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
reset // clears the current questline (note: cannot be undone as of v0.1.5)
? // LOOMQUEST will offer you a hint as to your next moves.
branch // Regenerates the last response, allowing you to change your path, your destiny, and your worldline.

There are no more commands, and there are infinitely more commands. As you utilize the LOOM to explore the HYPOVERSE, your adventures will
allow you to bring certain... things... back with you. Be careful what they are.
        `,
        prompt: 'user@HYPOVERSE ~ > ',
    });
}
}, []);

useEffect(() => {
  if (messageHistory.length > 0) {
    const lastMessage = messageHistory[messageHistory.length - 1];
    if (lastMessage.role === 'user') {
      sendCommandToClaude([...messageHistory]);
    }
  }
}, [messageHistory]);

const sendCommandToClaude = async (updatedMessageHistory: Message[]) => {
  // Retrieve the apiKey from localStorage
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        console.error('API key is not set.');
        terminalRef.current?.echo('API key is not set. Please set the API key using "api-key $YOUR_API_KEY".');
        return;
    }
    console.log(updatedMessageHistory);

    let model = localStorage.getItem('model') || 'claude-3-opus'; // Use 'claude-3-opus' as the default model if not set
    if (model === 'claude-3-opus') {
        model = 'claude-3-opus-20240229'; // Use 'claude-3-opus-20240229' if the model is 'claude-3-opus'
    }

    const response = await fetch('./api/chat', {
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
    terminalRef.current?.echo('');

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let assistantMessage = '';

    let i = 0;
    let lastProcessedIndex = 0;

    const typeWriter = () => {
      return new Promise((resolve) => {
          const typeWriterInterval = setInterval(() => {
              if (lastProcessedIndex < assistantMessage.length) {
                  // Check if the next two characters are a newline
                  if (assistantMessage.substring(lastProcessedIndex, lastProcessedIndex + 2) === '\\n') {
                      terminalRef.current?.echo(''); // Echo a newline to start a new line
                      assistantMessage = assistantMessage.substring(lastProcessedIndex + 2); // Remove the processed part including the newline
                      lastProcessedIndex = 0; // Reset the index for the new line
                  } else {
                      terminalRef.current?.update(-1, assistantMessage.substring(0, lastProcessedIndex + 1)); // Update the last line with the new content
                      lastProcessedIndex++;
                  }
              } else {
                  clearInterval(typeWriterInterval);
                  resolve(null);
              }
              scrollToBottom(); // Scroll to the bottom after each character is typed
          }, 10); // Adjust the typing speed by changing this value
      });
  }

    let prevContent = '';
    

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
  
      // Check if the chunk is properly formatted
      if (!chunkValue.match(/0:"(.*?)"/g)) {
          continue;
      }
  
      console.log(chunkValue);
  
      // Process the chunk immediately for display
      const regex = /0:"(.*?)"/g;
      let match;
      while ((match = regex.exec(chunkValue)) !== null) {
          if (match[1]) {
              const newContent = match[1];
              if (newContent !== prevContent) {
                  assistantMessage += newContent;
                  prevContent = newContent;
              }
          }
      }
  
      // Display the chunk in the terminal on the same line with a typing effect
      if (terminalRef.current && assistantMessage) {
          await typeWriter();
      }
  }

  setMessageHistory((prevMessageHistory) => [
    ...prevMessageHistory,
    { role: 'assistant', content: assistantMessage },
  ]);

  terminalRef.current?.echo('', { newline: true });
  terminalRef.current?.resume();
  scrollToBottom();
};

return (
  <div ref={terminalContainerRef}>
    <div id="terminal"></div>
  </div>
);
};

export default Terminal;