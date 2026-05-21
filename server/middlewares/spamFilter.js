import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const spamFilter = async (req, res, next) => {
    const text = req.body.content;

    // No text to check (image-only post), skip filter
    if (!text || text.trim() === '') return next();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent(
            `Is the following text spam, abusive, or harmful? 
Reply with ONLY the word YES or NO. Nothing else.

Text: "${text}"`
        );

        const answer = result.response.text().trim().toUpperCase();

        if (answer === 'YES') {
            return res.json({
                success: false,
                message: '⚠️ Your post was flagged as spam or harmful content and was not posted.'
            });
        }

        next(); // safe — allow post to be created

    } catch (error) {
        console.log('Spam filter error:', error.message);
        next(); // if AI fails, don't block the user
    }
};

export default spamFilter;