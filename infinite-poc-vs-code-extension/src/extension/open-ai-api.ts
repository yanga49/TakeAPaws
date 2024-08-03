import fetch from 'node-fetch';

// Load environment variables from .env or .zshrc using dotenv if needed
import * as dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the top of your entry file

// Define the expected structure of the OpenAI response
interface OpenAiResponse {
    choices?: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
        type: string;
        param: string;
        code: string;
    };
}

// Function to get text based on the emotion from OpenAI API
export async function getText(emotion: string): Promise<string> {
    console.log("api key", process.env.OPENAI_API_KEY);
    console.log('Button clicked:', emotion);

    try {
        // Fetch response from OpenAI API
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use the API key from environment variables
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Replace with the correct model ID
                messages: [{ role: "system", content: `Provide a fun fact or message about feeling ${emotion}.` }]
            })
        });

        // Cast the result of openAiResponse.json() to the OpenAiResponse type
        const openAiData = await openAiResponse.json() as OpenAiResponse;

        console.log('API Response:', openAiData); // Log the full API response

        // Handle API errors
        if (openAiData.error) {
            throw new Error(`OpenAI API Error: ${openAiData.error.message} (Code: ${openAiData.error.code})`);
        }

        // Handle case where no choices are returned
        if (!openAiData.choices || openAiData.choices.length === 0) {
            throw new Error('No choices returned from OpenAI API');
        }

        // Extract and return the message content
        const openAiMessage = openAiData.choices[0].message.content;
        return openAiMessage; 

    } catch (error) {
        console.error('Error fetching text from OpenAI:', error);
        return 'Sorry, something went wrong. Please try again later.';
    }
}
