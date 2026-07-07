// Render እንዳይዘጋው ፖርት የሚከፍት ጥቃቅን ሰርቨር
const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// *** የቦት ቶከን ***
const TOKEN = '8778040791:AAFMzEidaDflppu8bNjS8MOOnmIEZNC4OA0'; 
const bot = new TelegramBot(TOKEN, { polling: true });

// *** የ Supabase መረጃዎች (የተስተካከለ) ***
const SUPABASE_URL = 'https://jdusgofvctxmfgrnrgjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwMjQ3MiwiZXhwIjoyMDk4Mzc4NDcyfQ.J-aBPwvBOD7PPb9YTXd28yuUnuXhp3xARslADs31MNY'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_IDS = [6671917206, 5406168929]; 
const GROUP_ID = -1001937055873; 
const DASHBOARD_URL = 'https://comforting-flan-22bd95.netlify.app/';

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

console.log('🚀 ቦቱ ሁሉንም ማስተካከያዎች አካቶ ስራ ጀምሯል...');

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'እንኳን ወደ መጽሐፍ ቅዱስ የጥያቄና መልስ ቦት በሰላም መጡ! 👋\n\nከታች ካሉት አማራጮች ውስጥ መፈተን የሚፈልጉትን ይምረጡ፦', mainKeyboard);

    try {
        await supabase.from('bot_users').upsert([{ chat_id: chatId }], { onConflict: 'chat_id' });
    } catch (err) {
        console.error('User registration error:', err);
    }
});

bot.onText(/\/test/, (msg) => {
    bot.sendMessage(msg.chat.id, `✅ ቦቱ 100% በሰላም እየሰራ ነው!`, mainKeyboard);
});

// 🔄 ከዳታቤዝ ላይ ፈተናዎችን የሚስብ ክፍል
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) return;

    try {
        if (text === '📖 ብሉይ ኪዳን') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'old_testament');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ የብሉይ ኪዳን ፈተናዎች በአሁኑ ሰዓት አልተገኙም።', mainKeyboard);
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'የብሉይ ኪዳን ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        } 
        else if (text === '📖 አዲስ ኪዳን') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'new_testament');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ የአዲስ ኪዳን ፈተናዎች በአሁኑ ሰዓት አልተገኙም።', mainKeyboard);
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'የአዲስ ኪዳን ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        } 
        else if (text === '📚 አጠቃላይ') {
            const { data, error } = await supabase.from('exams').select('*').eq('category', 'general');
            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, '❌ አጠቃላይ ፈተናዎች በአሁኑ ሰዓት አልተገኙም።', mainKeyboard);
            }
            const buttons = data.map(exam => [{ text: exam.title, web_app: { url: exam.link } }]);
            bot.sendMessage(chatId, 'አጠቃላይ የክለሳ ፈተናዎችን ይምረጡ፦', { reply_markup: { inline_keyboard: buttons } });
        }
    } catch (err) {
        console.error('Supabase Fetch Error:', err);
        bot.sendMessage(chatId, '❌ መረጃ ከዳታቤዝ ላይ ሲሳብ ስህተት አጋጥሟል።', mainKeyboard);
    }
});

// =================================================================
// 🌟 1. ተፈታኙ ፈተናውን ሲጨርስ የማበረታቻ/የማሻሻያ መልዕክት ለባለቤቱ መላኪያ
// =================================================================
function sendFeedbackToStudent(studentChatId, studentName, examCode, score, totalQuestions) {
    const percentage = (score / totalQuestions) * 100;
    let feedbackMessage = `📊 **የፈተና ውጤትዎ ዝርዝር**\n\n📝 **የፈተናው ኮድ:** ${examCode}\n💯 **ያገኙት ውጤት:** ${score}/${totalQuestions} (${percentage.toFixed(1)}%)\n\n`;

    if (percentage >= 85) {
        feedbackMessage += `🌟 **ድንቅ ነው ${studentName}!** ቃልን በመንፈስና በእውቀት በሚገባ እያጠኑ መሆንዎን ውጤትዎ ያሳያል። ይህንን መልካም ልምድ በመቀጠል ለሌሎችም ምሳሌ ይሁኑ! በርቱ።`;
    } else if (percentage >= 60) {
        feedbackMessage += `👍 **በጣም ጥሩ ነው ${studentName}!** ያመጡት ውጤት የሚበረታታ ነው። ነገር ግን ጥቂት ደካማ ጎኖችን በማስተካከል በሚቀጥሉት ፈተናዎች ከዚህ የተሻለ የላቀ ውጤት ማምጣት እንደሚችሉ እናምናለን። ቃሉን ማንበብዎን ይግፉበት!`;
    } else {
        feedbackMessage += `📖 **አይዞዎት ${studentName}!** ይህ ፈተና ጥንካሬዎን የሚያሳድጉበት አጋጣሚ ነው። መጽሐፍ ቅዱስን በይበልጥ በጥንቃቄ በማንበብና ቃሉን በመመርመር በሚቀጥለው ጊዜ ውጤትዎን ማሻሻል ይችላሉ። ተስፋ ሳይቆርጡ በጸሎት በትጉ!`;
    }

    bot.sendMessage(studentChatId, feedbackMessage, { parse_mode: 'Markdown' })
        .catch(err => console.error(`ለተፈታኙ ${studentChatId} ግብረመልስ መላክ አልተቻለም:`, err));
}

// =================================================================
// 🔔 2. ውጤትን ለአድሚኖች በዌብ አፕ በተን መልክ "አዲስ የፈተና ውጤት መቷል" በሚል መላኪያ
// =================================================================
function sendResultToAdmin(studentName, examCode, score, totalQuestions) {
    const messageText = `🔔 **አዲስ የፈተና ውጤት መቷል፤ ገብተው ይመልከቱ!**\n\n` +
                        `👤 **የተፈታኝ ስም:** ${studentName}\n` +
                        `🔑 **የፈተና ኮድ:** ${examCode}\n` +
                        `📊 **ያገኘው ውጤት:** ${score}/${totalQuestions}`;

    ADMIN_IDS.forEach(adminId => {
        bot.sendMessage(adminId, messageText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: "📊 የውጤት መያዣ", web_app: { url: DASHBOARD_URL } }]]
            }
        }).catch(err => console.error(`ለአድሚን ${adminId} መላክ አልተቻለም:`, err));
    });
}

// =================================================================
// ⚡ 3. አዲስ ውጤት ዳታቤዝ ውስጥ ሲገባ (Insert ሲደረግ) ፈንክሽኖቹን የመቀስቀሻ ሰርጥ (Realtime Listener)
// =================================================================
// ማሳሰቢያ፡ በ Supabase Dashboard ላይ የ 'student_results' ሰንጠረዥ Replication -> Realtime መብራቱን አረጋግጥ።
supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'scores' }, // 'student_results' የሚለውን በሰንጠረዥህ ትክክለኛ ስም ተካው
    (payload) => {
      const newResult = payload.new;
      
      // ከዳታቤዝ የሚመጡትን ፊልዶች እዚህ ጋር ከሰንጠረዥህ አምዶች ስም ጋር አዛምዳቸው
      const studentChatId = newResult.chat_id || newResult.student_id; 
      const studentName = newResult.student_name || 'ተፈታኝ';
      const examCode = newResult.exam_code || 'ያልታወቀ';
      const score = Number(newResult.score || 0);
      const totalQuestions = Number(newResult.total_questions || 10); // በነባሪ 10 ካልመጣ

      if (studentChatId) {
          // 1. ለተማሪው ምክርና ውጤት ይልካል
          sendFeedbackToStudent(studentChatId, studentName, examCode, score, totalQuestions);
      }
      // 2. ለአድሚኖች ማሳወቂያና የዌብአፕ ሊንክ ይልካል
      sendResultToAdmin(studentName, examCode, score, totalQuestions);
    }
  )
  .subscribe();


// =================================================================
// 📣 ለአድሚኖች ብቻ የፈተና ማሰራጫ (Broadcast)
// =================================================================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1];

    if (!ADMIN_IDS.includes(chatId)) {
        return bot.sendMessage(chatId, '❌ ይህንን ትዕዛዝ ለመጠቀም ፈቃድ የለዎትም።');
    }

    bot.sendMessage(GROUP_ID, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
        .then(() => bot.sendMessage(chatId, '✅ መልዕክቱ ለግሩፑ በተሳካ ሁኔታ ተልኳል።'))
        .catch(err => bot.sendMessage(chatId, `❌ ለግሩፑ መላክ አልተቻለም።`));

    try {
        const { data: users, error } = await supabase.from('bot_users').select('chat_id');
        if (!error && users && users.length > 0) {
            users.forEach(user => {
                if (!ADMIN_IDS.includes(user.chat_id)) {
                    bot.sendMessage(user.chat_id, `📣 **አዲስ የፈተና ጥያቄ ተለቋል!**\n\n${broadcastMessage}`, { parse_mode: 'Markdown' })
                        .catch(err => console.error(err));
                }
            });
            bot.sendMessage(chatId, `📢 መልዕክቱ ለ ${users.length} የቦቱ ተጠቃሚዎችም በግል ተሰራጭቷል።`);
        }
    } catch (err) {
        console.error(err);
    }
});
