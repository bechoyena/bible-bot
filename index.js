// Render እንዳይዘጋው ፖርት የሚከፍት ጥቃቅን ሰርቨር
const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// *** አዲሱ የቦትህ ቶከን ***
const TOKEN = '8778040791:AAFMzEidaDflppu8bNjS8MOOnmIEZNC4OA0'; 
const bot = new TelegramBot(TOKEN, { polling: true });

// *** ያንተ ትክክለኛ የ Supabase መረጃዎች ***
const SUPABASE_URL = 'https://jdusgofvctxmfgrnrgjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDI0NzIsImV4cCI6MjA5ODM3ODQ3Mn0.UdAPxvkiexWyeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwMjQ3MiwiZXhwIjoyMDk4Mzc4NDcyfQ.J-aBPwvBOD7PPb9YTXd28yuUnuXhp3xARslADs31MNYBOWNpfvmrZ2Hf_whE5_hCS-L0LZzbgw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// *** የአድሚኖች ዝርዝር እና የዳሽቦርድ መረጃዎች ***
const ADMIN_IDS = [6671917206, 5406168929]; 
const GROUP_ID = -1001937055873; 
const DASHBOARD_URL = 'https://comforting-flan-22bd95.netlify.app/';

// =================================================================
// ⌨️ የዋናው ማውጫ ኪይቦርድ
// =================================================================
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📖 ብሉይ ኪዳን' }, { text: '📖 አዲስ ኪዳን' }],
            [{ text: '📚 አጠቃላይ' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

console.log('🚀 ቦቱ በደህንነትና በተሟላ አቅም ስራ ጀምሯል...');

// 1. የ /start ትዕዛዝ ሲላክ (ተጠቃሚውን በSupabase ውስጥ ይመዘግባል)
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'እንኳን ወደ መጽሐፍ ቅዱስ የጥያቄና መልስ ቦት በሰላም መጡ! 👋\n\nከታች ካሉት አማራጮች ውስጥ መፈተን የሚፈልጉትን ይምረጡ፦', mainKeyboard);

    // ተጠቃሚውን ለብሮድካስት እንዲሆን ዳታቤዝ ላይ መመዝገብ
    try {
        await supabase.from('bot_users').upsert([{ chat_id: chatId }], { onConflict: 'chat_id' });
    } catch (err) {
        console.error('User registration error:', err);
    }
});

// 2. የ /test ትዕዛዝ (ለአድሚኖች መፈተኛ)
bot.onText(/\/test/, (msg) => {
    bot.sendMessage(msg.chat.id, `✅ ቦቱ 100% በሰላም እየሰራ ነው!`, mainKeyboard);
});

// =================================================================
// 🔄 ከዋናው ማውጫ ተጭነው ሲገቡ ከSupabase በእንግሊዝኛ ስም የሚስብ ክፍል
// =================================================================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) return;

    try {
        // ሀ. ብሉይ ኪዳን (Old Testament)
        if (text === '📖 ብሉይ ኪዳን') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'Old Testament');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ የብሉይ ኪዳን ፈተናዎች በአሁኑ ሰዓት አልተገኙም።');
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'የብሉይ ኪዳን ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        } 
        // ለ. አዲስ ኪዳን (New Testament)
        else if (text === '📖 አዲስ ኪዳን') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'New Testament');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ የአዲስ ኪዳን ፈተናዎች በአሁኑ ሰዓት አልተገኙም።');
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'የአዲስ ኪዳን ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        } 
        // ሐ. አጠቃላይ (General)
        else if (text === '📚 አጠቃላይ') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'General');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ አጠቃላይ ፈተናዎች በአሁኑ ሰዓት አልተገኙም።');
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'አጠቃላይ የክለሳ ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        }
    } catch (err) {
        console.error('Supabase Fetch Error:', err);
        bot.sendMessage(chatId, '❌ መረጃ ከዳታቤዝ ላይ ሲሳብ ስህተት አጋጥሟል።');
    }
});

// =================================================================
// 🔔 ውጤትን ለሁለቱ አድሚኖች መላኪያ
// =================================================================
function sendResultToAdmin(studentName, examCode, score) {
    const messageText = `🔔 **አዲስ የተፈታኝ ውጤት ገብቷል!**\n\n👤 **ስም:** ${studentName}\n🔑 **ኮድ:** ${examCode}\n📊 **ውጤት:** ${score}`;
    ADMIN_IDS.forEach(adminId => {
        bot.sendMessage(adminId, messageText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: "📊 የውጤት መያዣ", web_app: { url: DASHBOARD_URL } }]] }
        }).catch(err => console.error(err));
    });
}

// =================================================================
// 📣 አዳዲስ ፈተናዎችን ለግሩፕም ሆነ ለቦቱ ተጠቃሚዎች ማሰራጫ (Broadcast)
// =================================================================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1];

    if (!ADMIN_IDS.includes(chatId)) {
        return bot.sendMessage(chatId, '❌ ይህንን ትዕዛዝ ለመጠቀም ፈቃድ የለዎትም።');
    }

    // 1. መጀመሪያ ለግሩፑ ይልካል
    bot.sendMessage(GROUP_ID, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
        .then(() => bot.sendMessage(chatId, '✅ መልዕክቱ ለግሩፑ በተሳካ ሁኔታ ተልኳል።'))
        .catch(err => bot.sendMessage(chatId, `❌ ለግሩፑ መላክ አልተቻለም (ቦቱን በግሩፑ ውስጥ አድሚን ማድረጎን ያረጋግጡ)።`));

    // 2. በመቀጠል ለሁሉም የቦቱ ተጠቃሚዎች በየግላቸው (Inbox) ያሰራጫል
    try {
        const { data: users, error } = await supabase.from('bot_users').select('chat_id');
        if (!error && users && users.length > 0) {
            users.forEach(user => {
                // ለአድሚኑ ድጋሚ እንዳይልክ መከላከል
                if (!ADMIN_IDS.includes(user.chat_id)) {
                    bot.sendMessage(user.chat_id, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
                        .catch(err => console.error(`ለተጠቃሚ ${user.chat_id} መላክ አልተቻለም`));
                }
            });
            bot.sendMessage(chatId, `📢 መልዕክቱ ለ ${users.length} የቦቱ ተጠቃሚዎችም በግል ተሰራጭቷል።`);
        }
    } catch (err) {
        console.error('Broadcast to users error:', err);
    }
});
