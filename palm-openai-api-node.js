// Import required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fetchModule = import('node-fetch');
const fetch = fetchModule.default || fetchModule;

// Create an Express application
const app = express();

// Middleware for enabling Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Middleware for parsing JSON in the request body
app.use(bodyParser.json());

// Define endpoint for text completions
app.post('/v1/completions', (req, res) => {
    handleTextCompletion(req.body, res);
});

// Define endpoint for chat completions
app.post(['/v1/chat/completions', '/chat/completions'], (req, res) => {
    handleChatCompletion(req.body, res);
});

// Define a wildcard endpoint for handling 404 Not Found
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Set the port for the server to listen on
const port = 3001;

// Start the server and log a message
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});

async function generateText(prompt) {
    // API key for accessing the language model API
    const mykey = 'AI.....................................';
    // API endpoint for text generation
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=' + mykey;

    // Headers for the API request
    const headers = {
        'Content-Type': 'application/json',
    };

    // Data payload for the API request
    const data = {
        prompt: {
            text: prompt,
        },
    };

    try {
        // Make a POST request to the language model API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        // Check if the API request was successful
        if (!response.ok) {
            const errorText = await response.text(); // Get the error response text
            console.error(`Failed to generate text. Status: ${response.status}. Error: ${errorText}`);
            throw new Error('Failed to generate text');
        }

        // Parse the JSON response from the API
        const result = await response.json();

        // Check if candidates array is defined and not empty
        if (result.candidates && result.candidates.length > 0) {
            return result.candidates[0].output;
        } else {
            // Return "..." if result is empty
            return '...';
        }
    } catch (error) {
        // Log any errors that occur during the process
        console.error('Error in generateText:', error);
        return '...';
    }
}



// Function to handle text completion requests
async function handleTextCompletion(requestData, res) {
    // Extract the prompt from the request data
    const prompt = requestData.prompt;

    // Add a check for prompt to avoid TypeError
    const promptTokens = prompt ? prompt.split(' ').length : 0;

    try {
        // Generate text based on the provided prompt
        const generatedText = await generateText(prompt);

        // Prepare a response object with the generated text
        const response = {
            id: `cmpl-${uuidv4()}`,
            object: 'text_completion',
            created: Date.now(),
            model: 'gpt-3.5-turbo',
            system_fingerprint: `fp_${uuidv4()}`,
            choices: [
                {
                    text: generatedText,
                    index: 0,
                    logprobs: null,
                    finish_reason: 'length',
                },
            ],
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: generatedText.split(' ').length,
                total_tokens: promptTokens + generatedText.split(' ').length,
            },
        };

        // Send the response back to the client
        res.json(response);
    } catch (error) {
        // Handle any errors that occur during text completion
        console.error('Error in handleTextCompletion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Function to handle chat completion requests
async function handleChatCompletion(requestData, res) {
    // Extract the array of messages from the request data
    const messages = requestData.messages;

    // Add a check for messages to avoid TypeError
    if (!messages || !Array.isArray(messages)) {
        // Log the received data for debugging
        console.error('Invalid messages format:', requestData);
        res.status(400).json({ error: 'Invalid request format' });
        return;
    }

    console.log('Received messages:', messages);

    // Extract the user's message from the array of messages
    const userMessages = messages.filter((message) => message.role === 'user');
    const userMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

    try {
        // Generate text based on the user's message
        const generatedText = await generateText(userMessage);

        // Prepare a response object with the generated text
        const response = {
            id: `chatcmpl-${uuidv4()}`,
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-3.5-turbo',
            usage: {
                prompt_tokens: userMessage.split(' ').length,
                completion_tokens: generatedText.split(' ').length,
                total_tokens: userMessage.split(' ').length + generatedText.split(' ').length,
            },
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: generatedText,
                    },
                    finish_reason: 'stop',
                    index: 0,
                },
            ],
        };

        // Send the response back to the client
        res.json(response);
    } catch (error) {
        // Handle any errors that occur during chat completion
        console.error('Error in handleChatCompletion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
