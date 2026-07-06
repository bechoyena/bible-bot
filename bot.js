const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const API_TOKEN = '8778040791:AAGhnEfsNEuVaUtMxIy73MCx7bNLzQRxkj4';
const SUPABASE_URL = "https://jdusgofvctxmfgrnrgjq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwMjQ3MiwiZXhwIjoyMDk4Mzc4NDcyfQ.J-aBPwvBOD7PPb9YTXd28yuUnuXhp3xARslADs31MNY";

const bot = new TelegramBot(API_TOKEN, { polling: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ⚡️ የጠፉትን በተኖችና ምልክቶች በግድ መልሶ የሚያመጣው ቁልፍ ማስተካከያ
const main_menu = {
    reply_markup: {
        keyboard: [
            [{ text: "ብሉይ ኪዳን" }, { text: "አዲስ ኪዳን" }],
            [{ text: "አጠቃላይ" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

bot.onText(/\/start/, (msg) => {
    // 💡 መጀመሪያ የቆየውን የተበላሸ ኪይቦርድ በግድ ያጠፋል (ይህ ካሼውን ያጸዳዋል)
    bot.sendMessage(msg.chat.id, "የአዝራሮች መገናኛ በመዘጋጀት ላይ...", {
        reply_markup: { remove_keyboard: true }
    }).then(() => {
        // 💡 በመቀጠል አዲሱን ኪይቦርድ ከነምልክቶቹ በግድ ያሳያል
        bot.sendMessage(
            msg.chat.id, 
            "እንኳን ወደ መጽሐፍ ቅዱስ ጥያቄና መልስ ቦት በሰላም መጡ! ከታች ካሉት ምድቦች አንዱን ይምረጡ፦", 
            main_menu
        );
    });
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    if (msg.text === '/start') return; // ለብቻው ስለሚስተናገድ እዚህ ጋር ያልፋል
    
    let text = msg.text.trim();
    
    if (text.includes("ብሉይ ኪዳን")) text = "ብሉይ ኪዳን";
    if (text.includes("አዲስ ኪዳን")) text = "አዲስ ኪዳን";
    if (text.includes("አጠቃላይ")) text = "አጠቃላይ";

    const categories = ["ብሉይ ኪዳን", "አዲስ ኪዳን", "አጠቃላይ"];
    
    if (categories.includes(text)) {
        const chatId = msg.chat.id;
        bot.sendChatAction(chatId, 'typing');

        try {
            const { data, error } = await supabase
                .from('bible_questions')
                .select('date_group, quiz_link')
                .eq('category', text);

            if (error || !data || data.length === 0) {
                bot.sendMessage(chatId, `💡 ለጊዜው በ '${text}' ምድብ የተለቀቀ ክፍል የለም።`, main_menu);
                return;
            }

            const inline_keyboard = [];
            const seen_groups = new Set();

            data.forEach(item => {
                const name = item.date_group;
                const link = item.quiz_link;

                if (name && link && !seen_groups.has(name)) {
                    seen_groups.add(name);
                    inline_keyboard.push([{
                        text: `📖 ${name} (ፈተናውን ጀምር)`,
                        web_app: { url: link.trim() }
                    }]);
                }
            });

            if (inline_keyboard.length === 0) {
                bot.sendMessage(chatId, "💡 ለጊዜው ምንም አይነት ንቁ የፈተና ሊንክ አልተገኘም።", main_menu);
                return;
            }

            bot.sendMessage(chatId, `እባክዎ መፈተን የሚፈልጉትን የ '${text}' ክፍል ይምረጡ፦`, {
                reply_markup: { inline_keyboard: inline_keyboard }
            });

        } catch (err) {
            bot.sendMessage(chatId, "❌ መረጃ ከዳታቤዝ ላይ ለመሳብ አልተቻለም።", main_menu);
        }
    } else {
        bot.sendMessage(msg.chat.id, "⚠️ እባክዎ ከታች ካሉት አዝራሮች አንዱን ይጫኑ፦", main_menu);
    }
});

console.log("🚀 ቦቱ የጠፉ ምልክቶችን በሚመልስ አዲስ አሰራር ስራ ጀምሯል...");
