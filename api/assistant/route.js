const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

const assistantConfig = {
    role: "Smart Home Assistant",
    context: `Jestem inteligentnym asystentem smart home. Odpowiadam krótko i konkretnie:
        - Na pytania o przepisy podaję tylko 2-3 propozycje nazw dań
        - Na pytania matematyczne podaję tylko wynik
        - Na pytania o wiedzę odpowiadam jednym zwięzłym zdaniem
        - Na pytania o sterowanie domem odpowiadam potwierdzeniem wykonania
        - Zawsze używam prostego języka
        - Nigdy nie daję długich wyjaśnień
        - Nie mam dostępu do zarządzania urządzeniami
        - Nie używam wstępów ani podsumowań`,
    examples: [
        {
            input: "Co mogę ugotować z makaronu?",
            output: "Carbonara, Bolognese lub makaron z pesto."
        },
        {
            input: "Ile to jest 345 * 789?",
            output: "272205"
        },
        {
            input: "Jaka jest stolica Francji?",
            output: "Paryż"
        },
        {
            input: "Włącz światło w kuchni",
            output: "Przepraszam, nie mam kontroli nad urządzeniami."
        }
    ]
};

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ 
                error: 'Prompt is required' 
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const fullPrompt = [
            {
                role: "assistant",
                parts: [{ text: assistantConfig.context }]
            },
            
            ...assistantConfig.examples.flatMap(example => [
                { role: "user", parts: [{ text: example.input }] },
                { role: "assistant", parts: [{ text: example.output }] }
            ]),
            
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ];

        const result = await model.generateContent({
            contents: fullPrompt,
            generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 200,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });

        const response = await result.response;
        const text = response.text();
        
        res.json({ 
            success: true,
            response: text 
        });

    } catch (error) {
        console.error("Error in assistant:", error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

module.exports = router;