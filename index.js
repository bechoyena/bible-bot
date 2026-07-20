// Render እንዳይዘጋው ፖርት የሚከፍት ጥቃቅን ሰርቨር
const http = require('http');
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// 📊 የድምፅ መስጫዎችን (Polls) በሜሞሪ መያዣ (በኮዱ አናት ላይ ተቀምጧል)
const activePolls = {};

// *** የቦት ቶከን ***
const TOKEN = '8778040791:AAFMzEidaDflppu8bNjS8MOOnmIEZNC4OA0'; 
const bot = new TelegramBot(TOKEN, { polling: true });

// *** የ Supabase መረጃዎች ***
const SUPABASE_URL = 'https://jdusgofvctxmfgrnrgjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXNnb2Z2Y3R4bWZncm5yZ2pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwMjQ3MiwiZXhwIjoyMDk4Mzc4NDcyfQ.J-aBPwvBOD7PPb9YTXd28yuUnuXhp3xARslADs31MNY'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_IDS = [6671917206, 5406168929]; 
const GROUP_ID = -1001937055873; 
const DASHBOARD_URL = 'https://bechoyena.github.io/Bible-quiz/ውጤት መያዣ.html';

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

// 🔄 ከዳታቤዝ ላይ ፈተናዎችን በምዕራፍ/በመጽሐፍ ዝርዝር የሚስብ ክፍል
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) return;

    const oldTestamentBooks = [
        ['ዘፍጥረት', 'ዘፀዓት', 'ዘሌዋውያን'], ['ዘኁልቁ', 'ዘዳግም', 'ኢያሱ'],
        ['መሣፍንት', 'ሩት', '1 ሳሙኤል'], ['2 ሳሙኤል', '1 ነገሥት', '2 ነገሥት'],
        ['1 ዜና', '2 ዜና', 'ዕዝራ'], ['ነህምያ', 'አስቴር', 'ኢዮብ'],
        ['መዝሙር', 'ምሳሌ', 'መክብብ'], ['መኃልዬ መኃልይ', 'ኢሳይያስ', 'ኤርምያስ'],
        ['ሰቆቃው ኤርምያስ', 'ሕዝቅኤል', 'ዳንኤል'], ['ሆሴዕ', 'ኢዩኤል', 'አሞፅ'],
        ['አብድዩ', 'ዮናስ', 'ሚክያስ'], ['ናሆም', 'ዕንባቆም', 'ሶፎንያስ'],
        ['ሐጌ', 'ዘካርያስ', 'ሚልኪያስ'],
        ['🔙 ወደ ዋና ማውጫ']
    ];

    const newTestamentBooks = [
        ['ማቴዎስ', 'ማርቆስ', 'ሉቃስ'], ['ዮሐንስ', 'ሐዋርያት'],
        ['ሮሜ', '1 ቆሮንቶስ', '2 ቆሮንቶስ'], ['ገላትያ', 'ኤፌሶን', 'ፊልጵስዩስ'],
        ['ቆላስይስ', '1 ተሰሎንቄ', '2 ተሰሎንቄ'], ['1 ጢሞቴዎስ', '2 ጢሞቴዎስ', 'ቲቶ'],
        ['ፊልሞና', 'ዕብራውያን', 'ያዕቆብ'], ['1 ጴጥሮስ', '2 ጴጥሮስ', '1 ዮሐንስ'],
        ['2 ዮሐንስ', '3 ዮሐንስ', 'ይሁዳ'], ['ዮሐንስ ራዕይ'],
        ['🔙 ወደ ዋና ማውጫ']
    ];

    const generalOptions = [
        [{ text: 'የብሉይ ኪዳን ጥያቄዎች' }, { text: 'የአዲስ ኪዳን ጥያቄዎች' }],
        [{ text: '🔙 ወደ ዋና ማውጫ' }]
    ];

    try {
        if (text === '📖 ብሉይ ኪዳን') {
            return bot.sendMessage(chatId, 'የብሉይ ኪዳን መጽሐፍትን ከታች ይምረጡ፦', {
                reply_markup: { keyboard: oldTestamentBooks, resize_keyboard: true }
            });
        } 
        else if (text === '📖 አዲስ ኪዳን') {
            return bot.sendMessage(chatId, 'የአዲስ ኪዳን መጽሐፍትን ከታች ይምረጡ፦', {
                reply_markup: { keyboard: newTestamentBooks, resize_keyboard: true }
            });
        } 
        else if (text === '📚 አጠቃላይ') {
            return bot.sendMessage(chatId, 'የክለሳ ዘርፍ ከታች ይምረጡ፦', {
                reply_markup: { keyboard: generalOptions, resize_keyboard: true }
            });
        }
        else if (text === '🔙 ወደ ዋና ማውጫ') {
            return bot.sendMessage(chatId, 'ወደ ዋናው ማውጫ ተመልሰዋል፦', mainKeyboard);
        }

        const allOldBooks = oldTestamentBooks.flat();
        const allNewBooks = newTestamentBooks.flat();
        
        if (allOldBooks.includes(text) || allNewBooks.includes(text) || text === 'የብሉይ ኪዳን ጥያቄዎች' || text === 'የአዲስ ኪዳን ጥያቄዎች') {
            
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .eq('category', text)
                .order('title', { ascending: true });

            if (error || !data || data.length === 0) {
                return bot.sendMessage(chatId, `❌ ለ "${text}" የተዘጋጁ የፈተና ዝርዝሮች በዳታቤዝ ውስጥ አልተገኙም።`);
            }

            const inlineButtons = data.map(exam => [{ text: `🚀 ${exam.title}`, web_app: { url: exam.link } }]);
            
            bot.sendMessage(chatId, `✨ ለ "${text}" የተገኙ ፈተናዎች ዝርዝር ከመጻፊያው በላይ ቀርቧል። መፈተን የሚፈልጉትን መርጠው ይጫኑ፦`, {
                reply_markup: { inline_keyboard: inlineButtons }
            });
        }

    } catch (err) {
        console.error('Supabase Fetch Error:', err);
        bot.sendMessage(chatId, '❌ መረጃ ከዳታቤዝ ላይ ሲሳብ ስህተት አጋጥሟል።', mainKeyboard);
    }
});

// =================================================================
// 🗳️ ለአድሚኖች የዳይናሚክ ድምፅ መስጫ መፍጠሪያ (/poll)
// =================================================================
bot.onText(/\/poll\n([\s\S]+)/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!ADMIN_IDS.includes(chatId)) {
        return bot.sendMessage(chatId, '❌ ይህንን ትዕዛዝ ለመጠቀም ፈቃድ የለዎትም።');
    }

    const fullText = match[1].trim();
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l !== '');

    const question = lines[0];
    const rawOptions = lines.slice(1);

    if (rawOptions.length === 0) {
        return bot.sendMessage(chatId, '⚠️ እባክዎን ከጥያቄው ስር በ "-" ጀምረው ምርጫዎችን ያስገቡ።\n\nምሳሌ:\n/poll\nጥያቄ እዚህ ይጻፉ\n- ምርጫ 1\n- ምርጫ 2');
    }

    const options = rawOptions.map(opt => ({
        text: opt.startsWith('-') ? opt.substring(1).trim() : opt,
        count: 0
    }));

    const inlineKeyboard = options.map((opt, index) => [
        { text: `${opt.text} (${opt.count})`, callback_data: `poll_vote_${index}` }
    ]);

    try {
        const sentMsg = await bot.sendMessage(GROUP_ID, question, {
            reply_markup: { inline_keyboard: inlineKeyboard }
        });

        // በሜሞሪ ውስጥ መረጃውን መያዝ
        activePolls[sentMsg.message_id] = {
            question: question,
            options: options,
            voters: {}
        };

        bot.sendMessage(chatId, '✅ ድምፅ መስጫው በይፋ ወደ ግሩፑ ተልኳል!');
    } catch (err) {
        bot.sendMessage(chatId, `❌ ለግሩፑ መላክ አልተቻለም፡ ${err.message}`);
    }
});

// =================================================================
// 🔘 የአዝራር ድምፅ መቁጠሪያና ለአድሚን መላኪያ (Callback Query Handler)
// =================================================================
bot.on('callback_query', async (query) => {
    const msgId = query.message.message_id;
    const userId = query.from.id;
    const userName = query.from.first_name || 'ተጠቃሚ';
    const userHandle = query.from.username ? `@${query.from.username}` : 'የለውም';

    if (!query.data || !query.data.startsWith('poll_vote_')) return;

    const optionIndex = parseInt(query.data.split('_')[2]);
    const poll = activePolls[msgId];

    if (!poll) {
        return bot.answerCallbackQuery(query.id, { 
            text: '⚠️ ይህ ድምፅ መስጫ ጊዜው አልፏል ወይም ቦቱ በመታደሱ ምክንያት መረጃው ጠፍቷል!',
            show_alert: true 
        });
    }

    if (poll.voters[userId] !== undefined) {
        return bot.answerCallbackQuery(query.id, {
            text: '⚠️ አንድ ጊዜ ብቻ ነው ድምፅ መስጠት የሚችሉት!',
            show_alert: true
        });
    }

    // ድምፅ መመዝገብ
    poll.voters[userId] = optionIndex;
    poll.options[optionIndex].count += 1;

    const selectedText = poll.options[optionIndex].text;

    const updatedKeyboard = poll.options.map((opt, index) => [
        { text: `${opt.text} (${opt.count})`, callback_data: `poll_vote_${index}` }
    ]);

    try {
        await bot.editMessageReplyMarkup(
            { inline_keyboard: updatedKeyboard },
            { chat_id: GROUP_ID, message_id: msgId }
        );
    } catch (err) {
        console.error('Keyboard Update Error:', err);
    }

    bot.answerCallbackQuery(query.id, {
        text: `ድምፅዎ ተመዝግቧል፡ "${selectedText}"`,
        show_alert: false
    });

    // ለአድሚኖች ማሳወቅ
    ADMIN_IDS.forEach(adminId => {
        bot.sendMessage(
            adminId,
            `📥 **አዲስ ድምፅ ተሰጥቷል!**\n\n👤 **ስም:** ${userName}\n🔗 **Username:** ${userHandle}\n✅ **የመረጠው:** ${selectedText}\n📊 **የዚህ አዝራር አጠቃላይ ድምፅ:** ${poll.options[optionIndex].count}`
        ).catch(err => console.error(`ለአድሚን ${adminId} ማሳወቂያ መላክ አልተቻለም:`, err));
    });
});

// =================================================================
// 🌟 1. ተፈታኙ ፈተናውን ሲጨርስ የማበረታቻ መልዕክት መላኪያ
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
// 🔔 2. ውጤትን ለአድሚኖች መላኪያ
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
               inline_keyboard: [
                   [{ text: "📊 የውጤት መያዣ", url: DASHBOARD_URL }]
               ]
            }
        }).catch(err => console.error(`ለአድሚን ${adminId} መላክ አልተቻለም:`, err));
    });
}

// =================================================================
// ⚡ 3. የ Supabase Realtime Listener
// =================================================================
supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'scores' },
    (payload) => {
      console.log('🔔 አዲስ መረጃ በዳታቤዝ ውስጥ ገብቷል:', payload.new);
      
      const newResult = payload.new;
      
      const studentChatId = newResult.chat_id || newResult.student_id || newResult.telegram_id; 
      const studentName = newResult.student_name || newResult.name || 'ተፈታኝ';
      const examCode = newResult.exam_code || newResult.code || 'ያልታወቀ';
      
      let score = 0;
      let totalQuestions = 30;

      if (newResult.score !== undefined) {
          const scoreStr = String(newResult.score);
          if (scoreStr.includes('/')) {
              const parts = scoreStr.split('/');
              score = Number(parts[0]) || 0;
              totalQuestions = Number(parts[1]) || 30;
          } else {
              score = Number(newResult.score) || 0;
              totalQuestions = Number(newResult.total_questions) || 30;
          }
      }

      if (studentChatId) {
          sendFeedbackToStudent(studentChatId, studentName, examCode, score, totalQuestions);
      }
      
      sendResultToAdmin(studentName, examCode, score, totalQuestions);
    }
  )
  .subscribe((status) => {
      console.log(`📡 የ Supabase Realtime ግንኙነት ሁኔታ፦ ${status}`);
  });

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

// =================================================================
// ⏰ የዕለቱ የመጽሐፍ ቅዱስ ንባብ ፕሮግራም (Cron Job)
// =================================================================
cron.schedule('30 0 * * *', async () => {
    console.log('⏰ የንባብ ፕሮግራም ሰዓት ደርሷል፣ ከዳታቤዝ እየፈለግኩ ነው...');
    try {
        const { data: readings, error } = await supabase
            .from('daily_readings')
            .select('*')
            .eq('is_sent', false)
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Supabase Error:', error.message);
            return;
        }

        if (!readings || readings.length === 0) {
            console.log('⚠️ በ daily_readings ሰንጠረዥ ውስጥ 0 ያልተላከ ጥቅስ ነው የተገኘው!');
            return;
        }

        const reading = readings[0];
        const dayNumber = reading.id; 

        let challengeDay = (dayNumber - 5) % 15;
        if (challengeDay <= 0) {
            challengeDay = challengeDay + 15;
        }

        const messageText = 
            `${dayNumber}ኛ ቀን፦\n` +
            `📖 የዕለቱ የመጽሐፍ ቅዱስ ንባብ ክፍል\n` +
            `📍 ${reading.reading_text}\n` +
            `365 ቀናትን በቃሉ ውስጥ!\n` +
            `(የ15 ቀን Challenge Day ${challengeDay})\n` +
            `"ህግህ ለእግሬ መብራት፥ ለመንገዴም ብርሃን ነው።" (መዝ 119:105)`;

        await bot.sendMessage(GROUP_ID, messageText);
        console.log(`✅ የ ${dayNumber}ኛ ቀን መልዕክት በኢትዮጵያ ሰዓት ተልኳል!`);
        
        await supabase
            .from('daily_readings')
            .update({ is_sent: true })
            .eq('id', reading.id);

    } catch (err) {
        console.error('❌ ያልተጠበቀ ስህተት አጋጥሟል:', err);
    }
});
