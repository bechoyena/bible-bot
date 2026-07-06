// Render እንዳይዘጋው ፖርት የሚከፍት ጥቃቅን ሰርቨር
const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');

// *** የቦትህ ትክክለኛ ቶከን ***
const TOKEN = '8778040791:AAFMzEidaDflppu8bNjS8MOOnmIEZNC4OA0'; 
const bot = new TelegramBot(TOKEN, { polling: true });

// *** የአድሚኖች ዝርዝር (6671917206 ያንተ ነው ፥ 5406168929 የአዲሱ አድሚን) ***
const ADMIN_IDS = [6671917206, 5406168929]; 

// *** የግሩፕ ID እና የዳሽቦርድ ሊንክ ***
const GROUP_ID = -1001937055873; 
const DASHBOARD_URL = 'https://comforting-flan-22bd95.netlify.app/';

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

// የሁሉንም ተጠቃሚዎች ID መመዝገቢያ
bot.on('message', (msg) => {
    if (msg.chat.type === 'private') {
        botUsers.add(msg.chat.id);
    }
});

// =================================================================
// 1. ለሁሉም አድሚኖች የ"ውጤት መያዣ" ቁልፍ የሚልክ ሲስተም
// =================================================================
function sendResultToAdmin(studentName, examCode, score) {
    const messageText = `🔔 **አዲስ የተፈታኝ ውጤት ገብቷል!**\n\n` +
                        `👤 **ስም:** ${studentName}\n` +
                        `🔑 **ኮድ:** ${examCode}\n` +
                        `📊 **ውጤት:** ${score}\n\n` +
                        `ሙሉ ዝርዝሩን ለማየት ከታች ያለውን የውጤት መያዣ ገጽ ይክፈቱ።`;

    // በዝርዝሩ ውስጥ ላሉት አድሚኖች በሙሉ መልዕክቱን በተን አድርጎ ይልካል
    ADMIN_IDS.forEach(adminId => {
        bot.sendMessage(adminId, messageText, {
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
        }).catch(err => console.error(`ለአድሚን ${adminId} መልዕክት መላክ አልተቻለም:`, err));
    });
}

// =================================================================
// 2. አዳዲስ ጥያቄዎች ሲለቀቁ ለግሩፕ እና ለተከታዮች ማሰራጫ (Broadcast)
// =================================================================
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1];

    // የላከው ሰው ከአድሚኖቹ አንዱ መሆኑን ማረጋገጫ
    if (!ADMIN_IDS.includes(chatId)) {
        return bot.sendMessage(chatId, '❌ ይህንን ትዕዛዝ ለመጠቀም ፈቃድ የለዎትም።');
    }

    // ሀ. ለግሩፑ መላክ
    bot.sendMessage(GROUP_ID, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
        .then(() => bot.sendMessage(chatId, '✅ መልዕክቱ ለግሩፑ ተልኳል።'))
        .catch(err => bot.sendMessage(chatId, `❌ ለግሩፑ መላክ አልተቻለም: ${err.message}`));

    // ለ. ለቦቱ ተከታዮች በሙሉ ማዳረስ
    let successCount = 0;
    botUsers.forEach((userId) => {
        bot.sendMessage(userId, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
            .then(() => { successCount++; })
            .catch(err => console.log(`ለተጠቃሚ ${userId} መላክ አልተቻለም`));
    });

    setTimeout(() => {
        bot.sendMessage(chatId, `📢 ማሳወቂያ ለ ${successCount} የቦቱ ተከታዮች በግል ደርሷቸዋል።`);
    }, 2000);
});
