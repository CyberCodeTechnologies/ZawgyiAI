// const OpenAI = require('openai');

class KnowledgeSkill {
    constructor() {
        this.name = 'knowledge';
        this.description = 'Handles general knowledge, chat, and Q&A';
        // this.openai = null; // OpenAI usage disabled
    }

    async execute(intent, params) {
        console.log(`🧠 KnowledgeSkill executing intent: ${intent}`);

        // if (!this.openai) {
        //     return {
        //         success: false,
        //         message: "I need an OpenAI API Key to answer general questions. Please configure OPENAI_API_KEY in .env."
        //     };
        // }

        switch (intent) {
            case 'ask':
            case 'chat':
                return await this.chat(params.query || params.message);
            
            default:
                // Fallback: treat unknown intents as chat if a query is present
                if (params.query || params.message) {
                    return await this.chat(params.query || params.message);
                }
                return { 
                    success: false, 
                    message: `KnowledgeSkill doesn't handle intent: ${intent}` 
                };
        }
    }

    async chat(query) {
        if (!query) {
            return { success: false, error: 'Empty query' };
        }

        return {
            success: true,
            message: "I can help with emails, calendar, flights, and universe simulation. For general questions, I'm limited to my basic knowledge right now."
        };

        /* OpenAI implementation disabled
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: "You are Zawgyi AI, a helpful, witty, and intelligent personal assistant. Answer the user's question concisely and accurately. If the question involves code, provide examples. Keep the tone friendly and professional." 
                    },
                    { role: "user", content: query }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            return {
                success: true,
                message: completion.choices[0].message.content
            };

        } catch (error) {
            console.error('OpenAI Chat error:', error);
            return { success: false, error: "I'm having trouble thinking right now. (API Error)" };
        }
        */
    }
}

module.exports = KnowledgeSkill;
