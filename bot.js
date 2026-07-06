const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const API_TOKEN = '8778040791:AAGhnEfsNEuVaUtMxIy73MCx7bNLzQRxkj4';
const SUPABASE_URL = "https://jdusgofvctxmfgrnrgjq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwMjQ3MiwiZXhwIjoyMDk4Mzc4NDcyfQ.J-aBPwvBOD7PPb9YTXd28yuUnuXhp3xARslADs31MNY";

// በሬንደር ላይ በፖሊንግ እንዲሰራ የተዘጋጀ
const bot = new TelegramBot(API_TOKEN, { 
    polling: {
        autoStart: true,
        params: { timeout: 10 }
    } 
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// የድሮ የዌብሁክ ግጭት ካለ ማጽጃ (በሬንደር ላይ የግድ ያስፈልጋል)
bot.deleteWebHook().then(() => {
    console.log("🔄 የዌብሁክ ግንኙነት ሙሉ በሙሉ ጸድቷል! ወደ ፖሊንግ ተቀይሯል።");
});

const main_menu = {
    reply_markup: {
        keyboard: [
            [{ text: "💡 ብሉይ ኪዳን" }, { text: "📖 አዲስ ኪዳን" }],
            [{ text: "🧠 አጠቃላይ" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

bot.onText(/\/start/, (msg) => {
    console.log(`👤 ተጠቃሚ ${msg.chat.id} /start ብሎ አስነስቷል`);
    bot.sendMessage(msg.chat.id, "እንኳን ወደ መጽሐፍ ቅዱስ ጥያቄና መልስ ቦት በሰላም መጡ! ከታች ካሉት ምድቦች አንዱን ይምረጡ፦", main_menu);
});

bot.on('message', async (msg) => {
    if (!msg.text || msg.text === '/start') return;
    
    let text = msg.text.trim();
    console.log(`📩 መልዕክት ደርሷል፦ "${text}"`);

    let cleanCategory = "";
    if (text.includes("ብሉይ ኪዳን")) cleanCategory = "ብሉይ ኪዳን";
    else if (text.includes("አዲስ ኪዳን")) cleanCategory = "አዲስ ኪዳን";
    else if (text.includes("አጠቃላይ")) cleanCategory = "አጠቃላይ";

    const chatId = msg.chat.id;
    
    if (cleanCategory !== "") {
        bot.sendMessage(chatId, `⏳ የ '${cleanCategory}' ክፍሎችን ከዳታቤዝ ላይ በመፈለግ ላይ...`);
        
        try {
            console.log(`🔎 ከ Supabase ላይ '${cleanCategory}' ን በመፈለግ ላይ...`);
            const { data, error } = await supabase
                .from('bible_questions')
                .select('date_group, quiz_link')
                .eq('category', cleanCategory);

            if (error) {
                console.error("❌ የዳታቤዝ ስህተት፦", error.message);
                bot.sendMessage(chatId, `❌ የዳታቤዝ ስህተት አጋጥሟል፦ ${error.message}`, main_menu);
                return;
            }

            if (!data || data.length === 0) {
                console.log(`💡 ለ '${cleanCategory}' ምንም የተመዘገበ ዳታ አልተገኘም`);
                bot.sendMessage(chatId, `💡 ይቅርታ፣ በ '${cleanCategory}' ምድብ ስር በዳታቤዙ ላይ የተመዘገበ ምንም ፈተና አልተገኘም።`, main_menu);
                return;
            }

            console.log(`🎉 ዳታ ተገኝቷል! የዕቃዎች ብዛት፦ ${data.length}`);
            const inline_keyboard = [];
            const seen_groups = new Set();

            data.forEach(item => {
                const name = item.date_group;
                const link = item.quiz_link;

                if (name && link && !seen_groups.has(name)) {
                    seen_groups.add(name);
                    
                    let finalLink = link.trim();
                    if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
                        finalLink = 'https://' + finalLink;
                    }

                    inline_keyboard.push([{
                        text: `📝 ${name} (ፈተናውን ጀምር)`,
                        web_app: { url: finalLink }
                    }]);
                }
            });

            if (inline_keyboard.length === 0) {
                bot.sendMessage(chatId, "💡 በሰንጠረዡ ላይ ያሉት የፈተና ሊንኮች ባዶ ናቸው።", main_menu);
                return;
            }

            bot.sendMessage(chatId, `እባክዎ መፈተን የሚፈልጉትን የ '${cleanCategory}' ክፍል ይምረጡ፦`, {
                reply_markup: { inline_keyboard: inline_keyboard }
            });

        } catch (err) {
            console.error("❌ ያልተጠበቀ ስህተት፦", err);
            bot.sendMessage(chatId, "❌ መረጃውን በምናነብበት ጊዜ ስህተት ተከስቷል።", main_menu);
        }
    } else {
        bot.sendMessage(chatId, "⚠️ እባክዎ ከታች ካሉት አዝራሮች አንዱን ይጫኑ፦", main_menu);
    }
});

console.log("🚀 ቦቱ በRender ላይ በንጽህና ስራ ጀምሯል...");
