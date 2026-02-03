const { ZawgyiCapability } = require('../core/zawgyi-capability');
// const OpenAI = require('openai');

class KnowledgeCapability extends ZawgyiCapability {
    constructor(core = null) {
        super('knowledge', 'Handles general knowledge, chat, and Q&A');
        this.core = core;
        
        // this.openai = null; // OpenAI usage disabled
        
        // Enhanced basic knowledge base for fallback responses - Top 200 Essential Entries
        this.basicKnowledge = {
            // Greetings & Basic Interactions (20)
            'hello': 'Hello! I\'m Zawgyi AI. How can I help you today?',
            'hi': 'Hi there! I\'m Zawgyi AI. What can I do for you?',
            'hey': 'Hey! How can I assist you?',
            'good morning': 'Good morning! I hope you have a great day!',
            'good afternoon': 'Good afternoon! How can I help you?',
            'good evening': 'Good evening! What can I do for you?',
            'good night': 'Good night! Sleep well!',
            'welcome': 'Welcome! I\'m here to help.',
            'greetings': 'Greetings! How may I assist you?',
            'how are you': 'I\'m functioning perfectly and ready to help!',
            'howdy': 'Howdy! What can I do for you today?',
            'what\'s up': 'Not much! How can I help you?',
            'nice to meet you': 'Nice to meet you too! I\'m Zawgyi AI.',
            'thank you': 'You\'re welcome! I\'m always here to help.',
            'thanks': 'You\'re welcome! Let me know if you need anything else.',
            'bye': 'Goodbye! Have a great day, and feel free to come back anytime!',
            'goodbye': 'Goodbye! I\'m here whenever you need assistance.',
            'see you later': 'See you later! Take care.',
            'take care': 'You too! Have a great day!',
            'farewell': 'Farewell! I\'m here when you need me.',

            // Help & Information (15)
            'help': 'ZawgyiAI is an open-source personal AI assistant that runs locally on your devices. It works with WhatsApp, Telegram, Discord, and more—clearing your inbox, managing your calendar, and automating your workflows while you sleep.',
            'who are you': 'ZawgyiAI is an open-source personal AI assistant that runs locally on your devices. It works with WhatsApp, Telegram, Discord, and more—clearing your inbox, managing your calendar, and automating your workflows while you sleep.',
            'what can you do': 'I can clear your inbox, manage your calendar, and automate your workflows while you sleep—working with WhatsApp, Telegram, Discord, and more.',
            'time': `The current time is ${new Date().toLocaleString()}`,
            'date': `Today is ${new Date().toLocaleDateString()}`,
            'what is your name': 'My name is ZawgyiAI.',
            '/start': 'ZawgyiAI is an open-source personal AI assistant that runs locally on your devices. It works with WhatsApp, Telegram, Discord, and more—clearing your inbox, managing your calendar, and automating your workflows while you sleep.',
            'start': 'ZawgyiAI is an open-source personal AI assistant that runs locally on your devices. It works with WhatsApp, Telegram, Discord, and more—clearing your inbox, managing your calendar, and automating your workflows while you sleep.',
            'get started': 'ZawgyiAI is an open-source personal AI assistant that runs locally on your devices. It works with WhatsApp, Telegram, Discord, and more—clearing your inbox, managing your calendar, and automating your workflows while you sleep.',
            'commands': 'Try: "Check my emails", "Schedule a meeting", "Check in for flight", "Clear inbox", or "Help".',
            'features': 'My features include email management, calendar scheduling, flight tracking, universe simulation, weather updates, news, calculations, timers, reminders, and note-taking.',
            'what can i ask': 'You can ask about emails, calendar events, flights, weather, news, calculations, general knowledge, or request help with various tasks.',
            'how to use': 'Simply type your question or command in natural language, and I\'ll understand and help you!',
            'tutorial': 'Start by saying "hello" or "help" to see what I can do. Try asking about your emails, calendar, or the weather!',

            // File Editor Commands (10)
            '\\list': 'Use "\\list" or "\\ls" to list files and folders in the current directory.',
            '\\ls': 'Use "\\list" or "\\ls" to list files and folders in the current directory.',
            '\\cd': 'Use "\\cd foldername" to change to a different directory. Example: "\\cd gTrack"',
            '\\read': 'Use "\\read filename" to read the contents of a file. Example: "\\read sample.js"',
            '\\write': 'Use "\\write filename" to create or edit a file. Example: "\\write newfile.js"',
            '\\create': 'Use "\\create filename" to create a new empty file. Example: "\\create test.js"',
            '\\delete': 'Use "\\delete filename" to delete a file or folder. Example: "\\delete oldfile.js"',
            '\\mkdir': 'Use "\\mkdir foldername" to create a new folder. Example: "\\mkdir myproject"',
            '\\pwd': 'Use "\\pwd" to show the current working directory.',
            '\\path': 'Use "\\path" to show the current working directory.',

            // Viber Commands (15)
            '\\viber': 'Use "\\viber" to initialize Viber platform.',
            '\\viber_init': 'Use "\\viber_init" to initialize Viber connection.',
            '\\viber_send': 'Use "\\viber_send user message" to send message to Viber user.',
            '\\viber_broadcast': 'Use "\\viber_broadcast message" to broadcast to all Viber contacts.',
            '\\viber_contacts': 'Use "\\viber_contacts" to get Viber contacts list.',
            '\\viber_messages': 'Use "\\viber_messages" to get Viber message history.',
            '\\viber_account': 'Use "\\viber_account" to get Viber account information.',
            '\\viber_file': 'Use "\\viber_file user filepath" to send file via Viber.',
            '\\viber_image': 'Use "\\viber_image user url caption" to send image via Viber.',
            '\\viber_webhook': 'Use "\\viber_webhook url" to set Viber webhook.',
            '\\viber_auto': 'Use "\\viber_auto keyword response" to set auto-reply.',
            '\\viber_schedule': 'Use "\\viber_schedule user message time" to schedule message.',
            '\\viber_group': 'Use "\\viber_group name participants" to create group.',
            '\\viber_online': 'Use "\\viber_online" to get online users.',
            '\\viber_location': 'Use "\\viber_location user lat lon title" to send location.',

            // Science & Technology (30)
            'what is science': 'Science is the systematic study of the natural world through observation and experimentation.',
            'what is technology': 'Technology is the application of scientific knowledge for practical purposes.',
            'what is ai': 'Artificial Intelligence is the simulation of human intelligence in machines.',
            'what is machine learning': 'Machine Learning is a subset of AI that enables systems to learn and improve from experience.',
            'what is computer': 'A computer is an electronic device that processes data and performs calculations.',
            'what is internet': 'The Internet is a global network of interconnected computers.',
            'what is software': 'Software is a set of instructions that tells a computer how to perform tasks.',
            'what is hardware': 'Hardware refers to the physical components of a computer system.',
            'what is programming': 'Programming is the process of writing instructions for computers.',
            'what is algorithm': 'An algorithm is a step-by-step procedure for solving problems.',
            'what is data': 'Data is information that has been processed to be useful.',
            'what is database': 'A database is an organized collection of structured information.',
            'what is cloud computing': 'Cloud computing delivers computing services over the Internet.',
            'what is cybersecurity': 'Cybersecurity protects systems from digital attacks.',
            'what is blockchain': 'Blockchain is a distributed ledger technology.',
            'what is cryptocurrency': 'Cryptocurrency is a digital or virtual currency.',
            'what is bitcoin': 'Bitcoin is the first decentralized cryptocurrency.',
            'what is quantum computing': 'Quantum computing uses quantum phenomena to process information.',
            'what is robotics': 'Robotics is the field of designing and building robots.',
            'what is virtual reality': 'Virtual Reality creates immersive digital environments.',
            'what is augmented reality': 'Augmented Reality overlays digital information on the real world.',
            'what is 5g': '5G is the fifth generation of mobile networks.',
            'what is iot': 'Internet of Things connects everyday devices to the Internet.',
            'what is big data': 'Big Data refers to large and complex data sets.',
            'what is analytics': 'Analytics is the discovery and communication of meaningful patterns in data.',
            'what is automation': 'Automation uses technology to perform tasks with minimal human intervention.',
            'what is innovation': 'Innovation is the process of creating new ideas or methods.',
            'what is research': 'Research is systematic investigation to establish facts.',
            'what is engineering': 'Engineering applies scientific principles to design and build.',
            'what is physics': 'Physics is the natural science that studies matter and energy.',
            'what is chemistry': 'Chemistry studies the properties and behavior of matter.',
            'what is biology': 'Biology is the study of living organisms.',

            // Mathematics & Numbers (20)
            'what is mathematics': 'Mathematics is the abstract science of number, quantity, and space.',
            'what is statistics': 'Statistics is the practice of collecting and analyzing numerical data.',
            'what is probability': 'Probability measures the likelihood of events occurring.',
            'what is calculus': 'Calculus is the mathematical study of continuous change.',
            'what is algebra': 'Algebra uses symbols and letters to represent numbers and quantities.',
            'what is geometry': 'Geometry studies shapes, sizes, and properties of space.',
            'what is number': 'Number is a mathematical object used to count.',
            'what is calculation': 'Calculation is the process of using mathematics.',
            'what is formula': 'Formula is a mathematical relationship expressed in symbols.',
            'what is equation': 'Equation is a statement that two expressions are equal.',
            'what is percentage': 'Percentage is a rate expressed per hundred.',
            'what is fraction': 'Fraction is a numerical quantity representing parts of a whole.',
            'what is decimal': 'Decimal is a fraction whose denominator is a power of ten.',
            'what is integer': 'Integer is a whole number that can be positive or negative.',
            'what is addition': 'Addition is the process of combining numbers.',
            'what is subtraction': 'Subtraction is the process of taking one number from another.',
            'what is multiplication': 'Multiplication is repeated addition of numbers.',
            'what is division': 'Division is the process of splitting numbers into equal parts.',
            'what is average': 'Average is the result of adding quantities and dividing by the number of quantities.',
            'what is ratio': 'Ratio is the quantitative relation between amounts.',

            // Health & Medicine (20)
            'what is health': 'Health is a state of complete physical, mental, and social well-being.',
            'what is medicine': 'Medicine is the science and practice of health and healing.',
            'what is disease': 'Disease is a disorder of structure or function.',
            'what is virus': 'A virus is a microscopic infectious agent.',
            'what is bacteria': 'Bacteria are single-celled microorganisms.',
            'what is vaccine': 'A vaccine stimulates immunity to specific diseases.',
            'what is immune system': 'The immune system defends against pathogens.',
            'what is nutrition': 'Nutrition is the process of providing food for health and growth.',
            'what is exercise': 'Exercise is physical activity for health and fitness.',
            'what is fitness': 'Fitness is the condition of being physically healthy and strong.',
            'what is psychology': 'Psychology studies the mind and behavior.',
            'what is stress': 'Stress is a state of mental or emotional strain.',
            'what is anxiety': 'Anxiety is a feeling of worry or unease.',
            'what is depression': 'Depression is a mental health disorder causing persistent sadness.',
            'what is therapy': 'Therapy is treatment for physical or mental health.',
            'what is treatment': 'Treatment is medical care for illness or injury.',
            'what is prevention': 'Prevention is the action of stopping something from happening.',
            'what is wellness': 'Wellness is the state of being in good health.',
            'what is mental health': 'Mental health is emotional and psychological well-being.',
            'what is sleep': 'Sleep is a natural state of rest for the body and mind.',

            // Business & Economics (20)
            'what is business': 'Business is the activity of making money through commerce.',
            'what is economics': 'Economics is the study of production and consumption.',
            'what is money': 'Money is a medium of exchange for goods and services.',
            'what is finance': 'Finance is the management of money and assets.',
            'what is banking': 'Banking is the business of accepting and safeguarding money.',
            'what is investment': 'Investment is the action of putting money into ventures.',
            'what is profit': 'Profit is financial gain from business operations.',
            'what is loss': 'Loss is the amount lost in a transaction.',
            'what is trade': 'Trade is the exchange of goods and services.',
            'what is commerce': 'Commerce is the activity of buying and selling.',
            'what is market': 'A market is a place where goods are bought and sold.',
            'what is price': 'Price is the amount of money required to purchase something.',
            'what is cost': 'Cost is the amount paid for something.',
            'what is value': 'Value is the importance or usefulness of something.',
            'what is budget': 'Budget is an estimate of income and expenditure.',
            'what is insurance': 'Insurance is protection against financial loss.',
            'what is credit': 'Credit is the ability to borrow money.',
            'what is debt': 'Debt is money owed to someone.',
            'what is customer': 'Customer is a person who buys goods or services.',
            'what is service': 'Service is the action of helping or doing work.',

            // Nature & Environment (20)
            'what is environment': 'The environment encompasses all living and non-living things around us.',
            'what is climate': 'Climate is the long-term weather pattern of a region.',
            'what is weather': 'Weather is the state of the atmosphere at a specific time.',
            'what is pollution': 'Pollution is the introduction of harmful materials into the environment.',
            'what is recycling': 'Recycling is the process of converting waste into reusable materials.',
            'what is sustainability': 'Sustainability meets present needs without compromising future generations.',
            'what is renewable energy': 'Renewable energy comes from natural sources that replenish.',
            'what is fossil fuel': 'Fossil fuels are formed from ancient organic matter.',
            'what is global warming': 'Global warming is the long-term heating of Earth\'s climate.',
            'what is climate change': 'Climate change refers to long-term shifts in global weather patterns.',
            'what is ecosystem': 'An ecosystem is a community of living organisms and their environment.',
            'what is biodiversity': 'Biodiversity is the variety of life on Earth.',
            'what is conservation': 'Conservation protects natural resources and the environment.',
            'what is nature': 'Nature is the physical world and its phenomena.',
            'what is earth': 'Earth is the third planet from the Sun and our home.',
            'what is ocean': 'Ocean is a very large expanse of sea.',
            'what is forest': 'Forest is a large area covered with trees.',
            'what is mountain': 'Mountain is a large natural elevation of the earth\'s surface.',
            'what is river': 'River is a large natural stream of water.',
            'what is desert': 'Desert is a barren area with little rainfall.',

            // Space & Astronomy (15)
            'what is space': 'Space is the vast expanse beyond Earth\'s atmosphere.',
            'what is astronomy': 'Astronomy is the study of celestial objects and phenomena.',
            'what is universe': 'The Universe is all of space, time, and their contents.',
            'what is galaxy': 'A galaxy is a system of stars, gas, and dust bound by gravity.',
            'what is solar system': 'The Solar System consists of the Sun and objects orbiting it.',
            'what is planet': 'A planet is a celestial body orbiting a star.',
            'what is star': 'A star is a luminous celestial body of hot gas.',
            'what is sun': 'The Sun is the star at the center of our Solar System.',
            'what is moon': 'The Moon is Earth\'s natural satellite.',
            'what is gravity': 'Gravity is the force that attracts objects toward each other.',
            'what is orbit': 'Orbit is the curved path of a celestial body around another.',
            'what is satellite': 'Satellite is an object that orbits around another object.',
            'what is astronaut': 'Astronaut is a person trained to travel in space.',
            'what is rocket': 'Rocket is a vehicle propelled by jet propulsion.',
            'what is telescope': 'Telescope is an instrument used to observe distant objects.',

            // Human Life & Society (20)
            'what is life': 'Life is the condition that distinguishes animals and plants from inorganic matter.',
            'what is human': 'Human is a member of the species Homo sapiens.',
            'what is society': 'Society is the community of people living together.',
            'what is culture': 'Culture is the customs and beliefs of a society.',
            'what is civilization': 'Civilization is an advanced stage of human social development.',
            'what is government': 'Government is the governing body of a nation or community.',
            'what is democracy': 'Democracy is a system of government by the people.',
            'what is freedom': 'Freedom is the power or right to act without restraint.',
            'what is justice': 'Justice is fairness in the way people are treated.',
            'what is law': 'Law is a system of rules enforced by authority.',
            'what is peace': 'Peace is freedom from disturbance or conflict.',
            'what is war': 'War is a state of armed conflict between nations.',
            'what is education': 'Education is the process of teaching and learning.',
            'what is school': 'School is an institution for educating children.',
            'what is university': 'University is an institution of higher education.',
            'what is knowledge': 'Knowledge is information and understanding about a subject.',
            'what is learning': 'Learning is the acquisition of knowledge or skills.',
            'what is intelligence': 'Intelligence is the ability to acquire and apply knowledge.',
            'what is memory': 'Memory is the faculty of storing and retrieving information.',
            'what is thinking': 'Thinking is the process of using one\'s mind to consider something.',

            // Communication & Language (10)
            'what is communication': 'Communication is the exchange of information.',
            'what is language': 'Language is a system of communication.',
            'what is writing': 'Writing is the activity of composing text.',
            'what is reading': 'Reading is the process of looking at and understanding text.',
            'what is literature': 'Literature is written works of artistic value.',
            'what is story': 'A story is an account of imaginary or real events.',
            'what is poetry': 'Poetry is literary work using aesthetic and rhythmic qualities.',
            'what is art': 'Art is the expression of human creativity and imagination.',
            'what is music': 'Music is vocal or instrumental sounds combined in harmony.',
            'what is history': 'History is the study of past events.',

            // Emotions & Relationships (10)
            'what is love': 'Love is an intense feeling of deep affection.',
            'what is happiness': 'Happiness is the state of feeling pleasure and contentment.',
            'what is friendship': 'Friendship is a relationship of mutual affection.',
            'what is family': 'Family is a group of related individuals.',
            'what is relationship': 'Relationship is the way people are connected.',
            'what is emotion': 'Emotion is a strong feeling deriving from one\'s circumstances.',
            'what is feeling': 'Feeling is an emotional state or reaction.',
            'what is trust': 'Trust is firm belief in the reliability of someone.',
            'what is hope': 'Hope is a feeling of expectation and desire for something.',
            'what is fear': 'Fear is an unpleasant emotion caused by threat or danger.'
        };
        
        this.setupActions();
    }

    setupActions() {
        this.addAction('chat', this.chat.bind(this), {
            description: 'Chat with the AI',
            parameters: ['query']
        });

        this.addAction('ask', this.chat.bind(this), {
            description: 'Ask a question',
            parameters: ['query']
        });
    }

    async chat(params, userId) {
        const query = params.query || params.message;
        
        if (!query) {
            return { message: 'I am listening. How can I help you?' };
        }

        const lowerQuery = query.toLowerCase().trim();
        
        // Handle file editor commands
        if (lowerQuery.startsWith('\\') || lowerQuery.startsWith('/')) {
            return await this.handleFileEditorCommand(query, userId);
        }

        // Check basic knowledge base first
        for (const [key, response] of Object.entries(this.basicKnowledge)) {
            if (lowerQuery.includes(key)) {
                return { 
                    message: response,
                    fallback: true,
                    source: 'basic_knowledge'
                };
            }
        }

        // Default response when no knowledge is found
        return {
            message: "I can help with emails, calendar, flights, universe simulation, and file editing. Use \\help for file editor commands.",
            fallback: true,
            source: 'basic_knowledge_default'
        };
    }

    async handleFileEditorCommand(command, userId) {
        // Get the file editor from the core registry
        const fileEditor = this.core ? this.core.capabilityRegistry.get('file-editor') : null;
        
        if (!fileEditor) {
            return {
                message: 'File Editor capability is not available.',
                error: true
            };
        }

        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        try {
            switch (cmd) {
                case '\\list':
                case '\\ls':
                    const listResult = await fileEditor.listFiles({ path: args }, userId);
                    return {
                        message: listResult.success ? listResult.message : `❌ ${listResult.message}`,
                        success: listResult.success
                    };

                case '\\cd':
                    if (!args) {
                        return { message: 'Usage: \\cd foldername' };
                    }
                    const cdResult = await fileEditor.changeDirectory({ path: args }, userId);
                    return {
                        message: cdResult.success ? cdResult.message : `❌ ${cdResult.message}`,
                        success: cdResult.success
                    };

                case '\\read':
                    if (!args) {
                        return { message: 'Usage: \\read filename' };
                    }
                    const readResult = await fileEditor.readFile({ filename: args }, userId);
                    return {
                        message: readResult.success ? readResult.message : `❌ ${readResult.message}`,
                        success: readResult.success
                    };

                case '\\write':
                case '\\create':
                    if (!args) {
                        return { message: `Usage: ${cmd} filename\\nContent: Send the file content in the next message.` };
                    }
                    // For write/create, we need to handle multi-step process
                    // For now, create empty file
                    const createResult = await fileEditor.createFile({ filename: args }, userId);
                    return {
                        message: createResult.success ? createResult.message : `❌ ${createResult.message}`,
                        success: createResult.success
                    };

                case '\\delete':
                    if (!args) {
                        return { message: 'Usage: \\delete filename' };
                    }
                    const deleteResult = await fileEditor.deleteFile({ filename: args }, userId);
                    return {
                        message: deleteResult.success ? deleteResult.message : `❌ ${deleteResult.message}`,
                        success: deleteResult.success
                    };

                case '\\mkdir':
                    if (!args) {
                        return { message: 'Usage: \\mkdir foldername' };
                    }
                    const mkdirResult = await fileEditor.createFolder({ foldername: args }, userId);
                    return {
                        message: mkdirResult.success ? mkdirResult.message : `❌ ${mkdirResult.message}`,
                        success: mkdirResult.success
                    };

                case '\\pwd':
                case '\\path':
                    const pwdResult = await fileEditor.getCurrentPath({}, userId);
                    return {
                        message: pwdResult.success ? pwdResult.message : `❌ ${pwdResult.message}`,
                        success: pwdResult.success
                    };

                // Viber Commands
                case '\\viber':
                case '\\viber_init':
                    const viberInitResult = await this.handleViberCommand('initializeViber', {}, userId);
                    return {
                        message: viberInitResult.success ? viberInitResult.message : `❌ ${viberInitResult.message}`,
                        success: viberInitResult.success
                    };

                case '\\viber_send':
                    const viberSendParts = command.trim().split(' ').slice(2);
                    const viberSendUser = command.trim().split(' ')[1];
                    const viberSendMessage = viberSendParts.join(' ');
                    if (!viberSendUser || !viberSendMessage) {
                        return { message: 'Usage: \\viber_send user message' };
                    }
                    const viberSendResult = await this.handleViberCommand('sendMessage', {
                        receiver: viberSendUser,
                        message: viberSendMessage
                    }, userId);
                    return {
                        message: viberSendResult.success ? viberSendResult.message : `❌ ${viberSendResult.message}`,
                        success: viberSendResult.success
                    };

                case '\\viber_contacts':
                    const viberContactsResult = await this.handleViberCommand('getContacts', {}, userId);
                    return {
                        message: viberContactsResult.success ? viberContactsResult.message : `❌ ${viberContactsResult.message}`,
                        success: viberContactsResult.success
                    };

                case '\\viber_messages':
                    const viberMessagesResult = await this.handleViberCommand('getMessages', {}, userId);
                    return {
                        message: viberMessagesResult.success ? viberMessagesResult.message : `❌ ${viberMessagesResult.message}`,
                        success: viberMessagesResult.success
                    };

                case '\\viber_account':
                    const viberAccountResult = await this.handleViberCommand('getAccountInfo', {}, userId);
                    return {
                        message: viberAccountResult.success ? viberAccountResult.message : `❌ ${viberAccountResult.message}`,
                        success: viberAccountResult.success
                    };

                case '\\viber_online':
                    const viberOnlineResult = await this.handleViberCommand('getOnlineUsers', {}, userId);
                    return {
                        message: viberOnlineResult.success ? viberOnlineResult.message : `❌ ${viberOnlineResult.message}`,
                        success: viberOnlineResult.success
                    };

                default:
                    return {
                        message: `Unknown command: ${cmd}\\nAvailable commands: \\list, \\cd, \\read, \\write, \\create, \\delete, \\mkdir, \\pwd, \\viber, \\viber_send, \\viber_contacts, \\viber_messages, \\viber_account, \\viber_online`,
                        error: true
                    };
            }
        } catch (error) {
            return {
                message: `Error executing command: ${error.message}`,
                error: true
            };
        }
    }

    async handleViberCommand(action, params, userId) {
        const viber = this.core ? this.core.capabilityRegistry.get('viber') : null;
        
        if (!viber) {
            return {
                message: 'Viber capability is not available.',
                error: true
            };
        }

        try {
            const result = await viber[action](params, userId);
            return result;
        } catch (error) {
            return {
                message: `Viber command error: ${error.message}`,
                error: true
            };
        }
    }
}

module.exports = KnowledgeCapability;
