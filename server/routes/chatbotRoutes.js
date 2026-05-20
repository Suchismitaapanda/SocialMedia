
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middlewares/auth.js';

const chatbotRouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

chatbotRouter.post('/', protect, async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.json({ success: false, message: 'Message is required' });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction:
                'You are a friendly assistant for PingUp, a social media app. ' +
                'Help users with questions about the app, posts, connections, and general topics. ' +
                'Be concise and friendly.'
        });

        const chat = model.startChat({
            history: (history || []).map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }))
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        res.json({ success: true, reply });

    } catch (error) {
        console.log('Chatbot error:', error.message);
        res.json({ success: false, message: 'AI is unavailable right now. Try again later.' });
    }
});

export default chatbotRouter;