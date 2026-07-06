// Render እንዳይዘጋው ፖርት የሚከፍት ጥቃቅን ሰርቨር (ከላይ ምንም ሳይነካ ይቀመጣል)
const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');

// *** የቦትህ ቶከን ***
const TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; //8778040791:AAFwwXhBsNn1DjI7OrUMuT52wnFmVip3v_4አስገባ;
const bot = new TelegramBot(TOKEN, { polling: true });

// *** ዋና ዋና መታወቂያዎች (IDs) ***
const ADMIN_ID = 5406168929; // ያንተ አድሚን ID
const GROUP_ID = -1001937055873; // የፈተና ግሩፕ ID
const DASHBOARD_URL = 'https://comforting-flan-22bd95.netlify.app/';

// የቦቱን ተከታዮች ID ሴቭ ማድረጊያ (ለማስታወቂያ ማሰራጫ)
// ማሳሰቢያ፦ በትናንሽ ፕሮጀክቶች ለአጭር ጊዜ እዚህ Array ውስጥ ይያዛል፤ ቦቱ Restart ሲሆን ይጠፋል። 
// በቋሚነት እንዲቀመጥ ወደፊት ወደ Supabase/Google Sheet መውሰድ ይቻላል።
const botUsers = new Set();

console.log('🚀 ቦቱ በRender ላይ በንጽህና ስራ ጀምሯል...');

// ተጠቃሚዎች /start ሲሉ ID ቸውን መመዝገብ
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'private') {
        botUsers.add(chatId);
    }
    bot.sendMessage(chatId, 'እንኳን ወደ መጽሐፍ ቅዱስ የጥያቄና መልስ ቦት በሰላም መጡ! 👋\n\nፈተናዎችን ለመፈተን የተለቀቁትን ሊንኮች ይጠቀሙ።');
});

// ማንኛውንም መልዕክት ሲልኩ ID ቸውን ለመያዝ
bot.on('message', (msg) => {
    if (msg.chat.type === 'private') {
        botUsers.add(msg.chat.id);
    }
});

// =================================================================
// 1. ለአድሚኑ ብቻ የ"ውጤት መያዣ" ቁልፍ የሚልክ ሲስተም
// =================================================================
// ይህ ፈንክሽን ተፈታኙ ፈተናውን ጨርሶ ውጤቱ Google Sheet/Supabase ላይ ሲያርፍ እንዲቀሰቀስ አድርገው
function sendResultToAdmin(studentName, examCode, score) {
    const messageText = `🔔 **አዲስ የተፈታኝ ውጤት ገብቷል!**\n\n` +
                        `👤 **ስም:** ${studentName}\n` +
                        `🔑 **ኮድ:** ${examCode}\n` +
                        `📊 **ውጤት:** ${score}\n\n` +
                        `ሙሉ ዝርዝሩን (የህብረት ስም፣ ድርሻ እና ስልክ) ለማየት ከታች ያለውን የውጤት መያዣ ገጽ ይክፈቱ።`;

    bot.sendMessage(ADMIN_ID, messageText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "📊 የውጤት መያዣ",
                        web_app: { url: DASHBOARD_URL }
                    }
                ]
            ]
        }
    }).catch(err => console.error('ለአድሚን መልዕክት መላክ አልተቻለም:', err));
}

// =================================================================
// 2. አዳዲስ ጥያቄዎች ሲለቀቁ ለግሩፕ እና ለተከታዮች ማሰራጫ (Broadcast)
// =================================================================
// አድሚኑ በቴሌግራም `/broadcast አዲስ ፈተና ወጥቷል...` ብሎ ሲጽፍ መልዕክቱን ያሰራጫል
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1]; // ከአሸባሪው (ትዕዛዙ) ቀጥሎ ያለው ሙሉ ጽሑፍ

    // አድሚኑ መሆኑን ማረጋገጥ
    if (chatId !== ADMIN_ID) {
        return bot.sendMessage(chatId, '❌ ይህንን ትዕዛዝ ለመጠቀም ፈቃድ የለዎትም።');
    }

    // ሀ. ለግሩፑ መላክ
    bot.sendMessage(GROUP_ID, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
        .then(() => bot.sendMessage(ADMIN_ID, '✅ መልዕክቱ ለግሩፑ ተልኳል።'))
        .catch(err => bot.sendMessage(ADMIN_ID, `❌ ለግሩፑ መላክ አልተቻለም: ${err.message}`));

    // ለ. ለቦቱ ተከታዮች በሙሉ ማዳረስ (በየተራ መላክ)
    let successCount = 0;
    botUsers.forEach((userId) => {
        bot.sendMessage(userId, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
            .then(() => { successCount++; })
            .catch(err => console.log(`ለተጠቃሚ ${userId} መላክ አልተቻለም`));
    });

    setTimeout(() => {
        bot.sendMessage(ADMIN_ID, `📢 ማሳወቂያ ለ ${successCount} የቦቱ ተከታዮች በግል ደርሷቸዋል።`);
    }, 2000);
});
