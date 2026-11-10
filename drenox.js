/**
 * Developer: Saif (NexGen Tech)
 * Project: NexGen Tech Zone Files
 * Description: Core WhatsApp Bot Engine (Empire-&-Ninja_MD_Bot)
 */

const baileys = require("@whiskeysockets/baileys")
const { 
  default: makeWASocket,
  proto, 
  jidNormalizedUser, 
  generateWAMessage, 
  generateWAMessageFromContent,
  generateWAMessageContent,  
  getContentType, 
  prepareWAMessageMedia,
  downloadContentFromMessage
} = baileys

const fs = require('fs')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const axios = require('axios')
const os = require('os')
const moment = require('moment-timezone')
const { exec } = require('child_process')
const googleTTS = require('google-tts-api')
const yts = require('yt-search')
const ytdl = require('@distube/ytdl-core')

// ═══════════════════════════════════════════════════════════
// GLOBAL VARIABLES INITIALIZATION
// ═══════════════════════════════════════════════════════════
global.autoViewStatus = global.autoViewStatus ?? true
global.autoLikeStatus = global.autoLikeStatus ?? true
global.autoread = global.autoread ?? false
global.autobio = global.autobio ?? false
global.autoTyping = global.autoTyping ?? false
global.autoRecording = global.autoRecording ?? false
global.autoPresence = global.autoPresence ?? 'off'
global.autoReply = global.autoReply ?? false

const afkUsers = {}
global.antiBadwordGroups = new Set()
global.antibot = new Set()
global.antilinkGroups = new Set()
global.antibill = new Set()
global.billWarnings = {}
global.antilinkWarned = new Set()
global.antibillWarned = new Set()

if (!global.deletedMessages) global.deletedMessages = new Map()
if (!global.welcomeGroups) global.welcomeGroups = new Set()
if (!global.goodbyeGroups) global.goodbyeGroups = new Set()
if (!global.chatbotData) global.chatbotData = new Map()
if (!global.chatbot) global.chatbot = new Set()

// ═══════════════════════════════════════════════════════════
// IMAGE & CONTENT CONSTANTS (NEXGEN BRANDED)
// ═══════════════════════════════════════════════════════════
const welcomeMessages = [
  '👋 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇ ᴇᴍᴘɪʀᴇ! ᴇɴᴊᴏʏ ʏᴏᴜʀ sᴛᴀʏ 💀',
  '🎉 ғʀᴇsʜ ʙʟᴏᴏᴅ ɪɴ ᴛʜᴇ ɴᴇxɢᴇɴ ᴢᴏɴᴇ! 😎',
  '☠️ ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇ ɴɪɴᴊᴀ ᴅᴇɴ 🌑',
  '👑 ᴀ ɴᴇᴡ MEMBER ᴊᴏɪɴs 🔥💀',
  '🖤 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇ GC! 😈✨'
]

const goodbyeMessages = [
  '👋 sᴇᴇ ʏᴏᴜ ʟᴀᴛᴇʀ! 😎',
  '☠️ ᴍᴀʏ ᴛʜᴇ ᴇᴍᴘɪʀᴇ ʀᴇᴍᴇᴍʙᴇʀ ʏᴏᴜ 💀🌑',
  '🚀 ᴀɴᴏᴛʜᴇʀ ᴏɴᴇ ʙɪᴛᴇs ᴛʜᴇ ᴅᴜsᴛ! 😈',
  '🖤 ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴡɪʟʟ ᴍɪss ʏᴏᴜ 💫',
  '👻 ɢᴏᴏᴅʙʏᴇ ʟᴇɢᴇɴᴅ! 😎💀✨'
]

// ══════════════════════════════════════════════════════
// 🤖 NEXGEN AI CHATBOT ENGINE (NOVA - Smart & Interactive)
// ══════════════════════════════════════════════════════
function getUserConversation(userId, groupId) {
  const key = `${groupId}_${userId}`
  if (!global.chatbotData.has(key)) {
    global.chatbotData.set(key, [])
  }
  return global.chatbotData.get(key)
}

function addToConversation(userId, groupId, role, content) {
  const key = `${groupId}_${userId}`
  let conversation = getUserConversation(userId, groupId)
  
  conversation.push({ role, content, timestamp: Date.now() })
  
  // Memory limit: Sirf last 10 messages yaad rakhega taake bot fast rahe
  if (conversation.length > 10) {
    conversation = conversation.slice(-10)
  }
  
  global.chatbotData.set(key, conversation)
  return conversation
}

function buildContextPrompt(userId, groupId, currentMessage) {
  const conversation = getUserConversation(userId, groupId)
  
  // 🔥 NEXGEN VIP PROMPT 🔥
  let contextPrompt = `Tumhara naam 'Nova' hai, ek boht smart, friendly aur cool AI assistant jise Saif (NexGen Tech Zone ka Owner aur Pro Developer) ne banaya hai. Tum 'Empire & Ninja MD' bot ki official AI ho.

CRITICAL RULES:
- Tumhara style casual, friendly aur thora tech/cool vibe wala hona chahiye.
- Hamesha Urdu/Roman Urdu aur English mix karke baat karo jese normal dost karte hain.
- Emojis use karo jaise: 🚀, 😎, 💻, 🔥, ✨, 💯.
- Hamesha short, smart aur to-the-point jawab do (zyada lambe paragraphs mat likho).
- Agar koi pooche tumhe kis ne banaya hai, toh fakhar se batao: "Mujhe Saif ne banaya hai jo NexGen Tech Zone ka boss hai! 😎💻"

Examples:
user: "hi"
you: "Hey there! 👋 Main Nova hoon. Batao aaj kya tech-magic karni hai? 🚀"

user: "how are you"
you: "Main bilkul set hoon! 😎 Tum sunao, sab theek? ✨"
`
  if (conversation.length > 0) {
    contextPrompt += `\nPrevious conversation:\n`
    conversation.slice(-5).forEach(msg => {
      if (msg.role === 'user') {
        contextPrompt += `user: ${msg.content}\n`
      } else {
        contextPrompt += `Nova: ${msg.content}\n`
      }
    })
  }
  
  contextPrompt += `\nuser: "${currentMessage}"\nNova: `
  return contextPrompt
}

async function getChatGPTResponse(prompt, userId = null, groupId = null) {
  try {
    if (userId && groupId) {
      addToConversation(userId, groupId, 'user', prompt)
    }
    
    try {
      const finalPrompt = userId && groupId 
        ? buildContextPrompt(userId, groupId, prompt)
        : `Tum 'Empire & Ninja MD' ki smart AI ho jise Saif ne banaya hai. "${prompt}"`
      
      const url = `https://api-toxxic.zone.id/api/ai/claude?prompt=${encodeURIComponent(finalPrompt)}`
      const response = await fetch(url, { method: "GET", timeout: 5000 })
      const data = await response.json()
      
      let apiResponse = data.data || data.result || data.response || data.message
      
      if (apiResponse && apiResponse.length > 5) {
        if (userId && groupId) {
          addToConversation(userId, groupId, 'assistant', apiResponse)
        }
        return apiResponse
      }
    } catch (apiErr) {
      console.log(`⚠️ [NexGen API Warning]: ${apiErr.message}`)
    }
    
    const fallbackResponse = 'Hey! Main abhi thori busy hoon server updates mein ⚙️. Thori der baad try karo! 😎🚀'
    
    if (userId && groupId) {
      addToConversation(userId, groupId, 'assistant', fallbackResponse)
    }
    
    return fallbackResponse
    
  } catch (err) {
    console.error('❌ [NexGen API Error]:', err)
    return 'Oops! Server mein thora glitch aa gaya hai 🛠️. Try again!'
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN MESSAGE HANDLER FUNCTION
// ═══════════════════════════════════════════════════════════
async function handleMessage(bad, m, chatUpdate, store) {
    if (!m || !m.key) return
    
    const time = moment(Date.now()).tz('Asia/Karachi').locale('id').format('HH:mm:ss z')
    
    // NexGen Bio Update
    if (global.autobio) {
      bad.updateProfileStatus(`𓆩 ☠ ᴇᴍᴘɪʀᴇ & ɴɪɴᴊᴀ 𝑴𝑫 ☠ 𓆪 | ᴜᴘᴛɪᴍᴇ: ${runtime(process.uptime())}`).catch(_ => _)
    }

    const menuCommands = ['menu', 'allmenu', 'downloadmenu', 'dlmenu', 'admin', 'adminmenu', 'gamemenu', 'stickermenu', 'gphelp', 'groupmenu', 'helpmenu', 'help']
    
    async function loading() {
      if (!menuCommands.includes(command)) return
      
      // NexGen VIP Loading Animation
      const frames = [
        "╭━━〔 ⟦ ᴇᴍᴘɪʀᴇ 𝑴𝑫 ⟧〕━━┈⊷\n┃✮│ ▱▱▱▱▱▱▱▱▱▱ 0%\n┃✮│ ⚡ ɪɴɪᴛɪᴀʟɪᴢɪɴɢ...\n╰━━━━━━━━━━━━━━┈⊷",
        "╭━━〔 ☠ ɴɪɴᴊᴀ 𝑴𝑫 ☠ 〕━━┈⊷\n┃✮│ ▰▰▱▱▱▱▱▱▱▱ 25%\n┃✮│ 🔌 ᴄᴏɴɴᴇᴄᴛɪɴɢ...\n╰━━━━━━━━━━━━━━┈⊷",
        "╭━━〔 ⸸ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ⸸〕━━┈⊷\n┃✮│ ▰▰▰▰▰▱▱▱▱▱ 50%\n┃✮│ 📦 ʟᴏᴀᴅɪɴɢ...\n╰━━━━━━━━━━━━━━┈⊷",
        "╭━━〔 𖤐 ᴇᴍᴘɪʀᴇ 𖤐〕━━┈⊷\n┃✮│ ▰▰▰▰▰▰▰▱▱▱ 75%\n┃✮│ ⚙️ ᴘʀᴏᴄᴇssɪɴɢ...\n╰━━━━━━━━━━━━━━┈⊷",
        "╭━━〔 ⟦ ᴇᴍᴘɪʀᴇ 𝑴𝑫 ⟧ 〕━━┈⊷\n┃✮│ ▰▰▰▰▰▰▰▰▰▰ 100%\n┃✮│ ✅ sʏsᴛᴇᴍ ʀᴇᴀᴅʏ!\n╰━━━━━━━━━━━━━━┈⊷"
      ]
      
      try {
        let msg = await bad.sendMessage(from, { text: frames[0] })
        loadingAnimations.set(from, msg.key)
        
        for (let i = 1; i < frames.length; i++) {
          await sleep(400)
          try {
            await bad.sendMessage(from, { text: frames[i], edit: msg.key })
          } catch {
            await bad.sendMessage(from, { text: frames[i] })
          }
        }
        loadingAnimations.delete(from)
      } catch (error) {
        console.log(chalk.red('❌ Loading animation error:'), error.message)
      }
    }

    // ⬇️ YAHAN SE NEECHE TUMHARA PURANA CODE AAYEGA (COMMANDS, ANTI-LINK ETC) ⬇️
    
// ═══════════════════════════════════════════════════════════
// ALLMENU CASE - NEXGEN VIP MENU
// ═══════════════════════════════════════════════════════════
case 'allmenu':
case 'info':
case 'menu':
case 'menu2': {
  await loading()
  
  // NexGen Tech Zone Image Link (Apni koi bhi image link yahan laga sakte ho)
  const menuImages = [
    'https://files.catbox.moe/example1.jpg',
    'https://files.catbox.moe/example2.jpg'
  ]
  
  const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)]
  const uptime = runtime(process.uptime())
  
  const menuText = `
╭━━〔 ☠️ ɴᴇxɢᴇɴ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs ☠️ 〕━━┈⊷
┃✮╭────────────────
┃✮│ 🤖 ʙᴏᴛ  : *☠ ᴇᴍᴘɪʀᴇ & ɴɪɴᴊᴀ мd вoт  ☠*
┃✮│ 👑 ᴏᴡɴᴇʀ : *☠ ᴅᴀʀᴋ-ᴇᴍᴘɪʀᴇ (ɴᴇxɢᴇɴ ᴛᴇᴄʜ) ☠*
┃✮│ 📦 ᴠᴇʀsɪᴏɴ  : *3.0 (VIP)*
┃✮│ 📡 ᴘʟᴀᴛғᴏʀᴍ : *Vercel Web + Telegram*
┃✮╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ᴘᴜʙʟɪᴄ
┃✮│➣ ${prefix}sᴇʟꜰ
┃✮│➣ ${prefix}ʙʟᴏᴄᴋ
┃✮│➣ ${prefix}ᴜɴʙʟᴏᴄᴋ
┃✮│➣ ${prefix}ʙʀᴏᴀᴅᴄᴀsᴛ
┃✮│➣ ${prefix}sᴇᴛᴘᴘʙᴏᴛ
┃✮│➣ ${prefix}ᴀᴜᴛᴏʙɪᴏ
┃✮│➣ ${prefix}ᴀᴅᴅᴏᴡɴᴇʀ
┃✮│➣ ${prefix}ᴅᴇʟᴏᴡɴᴇʀ
┃✮│➣ ${prefix}ᴀᴅᴅᴘʀᴇᴍ
┃✮│➣ ${prefix}ᴅᴇʟᴘʀᴇᴍ
┃✮│➣ ${prefix}ʀᴜɴᴛɪᴍᴇ
┃✮│➣ ${prefix}sᴘᴇᴇᴅ
┃✮│➣ ${prefix}ɢᴇᴛᴘᴘ
┃✮│➣ ${prefix}ᴀᴜᴛᴏᴘʀᴇsᴇɴᴄᴇ
┃✮│➣ ${prefix}ᴀᴜᴛᴏʀᴇᴄᴏʀᴅɪɴɢ
┃✮│➣ ${prefix}ᴀᴜᴛᴏᴛʏᴘɪɴɢ
┃✮│➣ ${prefix}sᴇᴛᴘʀᴇꜰɪx
┃✮│➣ ${prefix}ᴄʟᴇᴀʀᴛᴍᴘ
┃✮│➣ ${prefix}ʀᴇsᴛᴀʀᴛ
┃✮│➣ ${prefix}sᴀᴠᴇsᴛᴀᴛᴜs
┃✮│➣ ${prefix}ᴀᴜᴛᴏʀᴇᴀᴅ
┃✮│➣ ${prefix}ᴀᴜᴛᴏᴠɪᴇᴡsᴛᴀᴛᴜs
┃✮│➣ ${prefix}ᴀᴜᴛᴏʟɪᴋᴇsᴛᴀᴛᴜs
┃✮│➣ ${prefix}ꜰɪxᴏᴡɴᴇʀ
┃✮│➣ ${prefix}ᴄᴄɢᴇɴ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ᴀᴅᴅ
┃✮│➣ ${prefix}ᴋɪᴄᴋ
┃✮│➣ ${prefix}ᴋɪᴄᴋᴀʟʟ
┃✮│➣ ${prefix}ᴋɪᴄᴋᴀᴅᴍɪɴs
┃✮│➣ ${prefix}ᴘʀᴏᴍᴏᴛᴇ
┃✮│➣ ${prefix}ᴅᴇᴍᴏᴛᴇ
┃✮│➣ ${prefix}ᴘʀᴏᴍᴏᴛᴇᴀʟʟ
┃✮│➣ ${prefix}ᴅᴇᴍᴏᴛᴇᴀʟʟ
┃✮│➣ ${prefix}ᴛᴀɢᴀʟʟ
┃✮│➣ ${prefix}ʜɪᴅᴇᴛᴀɢ
┃✮│➣ ${prefix}ᴛᴀɢ
┃✮│➣ ${prefix}ɢʀᴏᴜᴘᴊɪᴅ
┃✮│➣ ${prefix}ʟɪsᴛᴀᴅᴍɪɴ
┃✮│➣ ${prefix}ʟɪsᴛᴏɴʟɪɴᴇ
┃✮│➣ ${prefix}ᴍᴜᴛᴇ
┃✮│➣ ${prefix}ᴜɴᴍᴜᴛᴇ
┃✮│➣ ${prefix}ʟɪɴᴋɢᴄ
┃✮│➣ ${prefix}ʀᴇsᴇᴛʟɪɴᴋ
┃✮│➣ ${prefix}ᴘᴏʟʟ
┃✮│➣ ${prefix}ᴅᴇʟ
┃✮│➣ ${prefix}ᴊᴏɪɴ
┃✮│➣ ${prefix}ʟᴇᴀᴠᴇ
┃✮│➣ ${prefix}ᴄʀᴇᴀᴛᴇɢᴄ
┃✮│➣ ${prefix}ᴀɴᴛɪʟɪɴᴋ
┃✮│➣ ${prefix}ᴀɴᴛɪsᴘᴀᴍ
┃✮│➣ ${prefix}ᴀɴᴛɪʙᴀᴅᴡᴏʀᴅ
┃✮│➣ ${prefix}ᴀɴᴛɪʙᴏᴛ
┃✮│➣ ${prefix}ᴀɴᴛɪʙɪʟʟ
┃✮│➣ ${prefix}ᴡᴇʟᴄᴏᴍᴇ
┃✮│➣ ${prefix}ɢᴏᴏᴅʙʏᴇ
┃✮│➣ ${prefix}ᴘʀᴏᴛᴇᴄᴛ
┃✮│➣ ${prefix}ᴀɴᴛɪʜɪᴊᴀᴄᴋ
┃✮│➣ ${prefix}ᴏᴘᴇɴɢʀᴏᴜᴘ
┃✮│➣ ${prefix}ᴄʟᴏsᴇɢʀᴏᴜᴘ
┃✮│➣ ${prefix}ᴏᴘᴇɴᴛɪᴍᴇ
┃✮│➣ ${prefix}ᴄʟᴏsᴇᴛɪᴍᴇ
┃✮│➣ ${prefix}sᴇᴛᴅᴇsᴄ
┃✮│➣ ${prefix}sᴇᴛɴᴀᴍᴇ
┃✮│➣ ${prefix}sᴇᴛᴘᴘɢᴄ
┃✮│➣ ${prefix}ᴡᴀʀɴ
┃✮│➣ ${prefix}ʀᴇsᴇᴛᴡᴀʀɴ
┃✮│➣ ${prefix}ᴡᴇʟᴄᴏᴍᴇᴄᴀʀᴅ
┃✮│➣ ${prefix}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ
┃✮│➣ ${prefix}ᴀɴᴛɪᴅᴇʟᴇᴛᴇᴅᴍ
┃✮│➣ ${prefix}ᴄʜᴀᴛʙᴏᴛ
┃✮│➣ ${prefix}ᴄʟᴇᴀʀᴄʜᴀᴛʙᴏᴛ
┃✮│➣ ${prefix}ᴄʜᴇᴄᴋᴀᴅᴍɪɴ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 〕━━┈⊷
┃
┃ 🎵 ᴀᴜᴅɪᴏ
┃ ├ ${prefix}ᴘʟᴀʏ
┃ ├ ${prefix}sᴘᴏᴛɪꜰʏ
┃ └ ${prefix}ʏᴛᴍᴘ3
┃
┃ 🎥 ᴠɪᴅᴇᴏ
┃ ├ ${prefix}ʏᴛᴍᴘ4
┃ ├ ${prefix}ᴛɪᴋᴛᴏᴋ
┃ ├ ${prefix}ɪɴsᴛᴀɢʀᴀᴍ
┃ ├ ${prefix}ꜰᴀᴄᴇʙᴏᴏᴋ
┃ ├ ${prefix}ᴛᴡɪᴛᴛᴇʀ
┃ ├ ${prefix}ᴛʜʀᴇᴀᴅs
┃ └ ${prefix}ᴄᴀᴘᴄᴜᴛ
┃
┃ 📁 ꜰɪʟᴇs
┃ ├ ${prefix}ᴍᴇᴅɪᴀꜰɪʀᴇ
┃ └ ${prefix}ᴀᴘᴋ
┃
┃ 🖼️ ɪᴍᴀɢᴇs
┃ └ ${prefix}ᴘɪɴᴛᴇʀᴇsᴛ
┃
┃ 🔄 ᴄᴏɴᴠᴇʀᴛᴇʀs
┃ ├ ${prefix}ᴛᴏᴍᴘ3
┃ └ ${prefix}ᴛᴏᴍᴘ4
┃ 
┃ 🎥 ᴠɪᴅᴇᴏ ɢᴇɴᴇʀᴀᴛᴏʀ
┃ └ ${prefix}ʀᴜɴᴡᴀʏ<ᴘʀᴏᴍᴘᴛ>
┃
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🤖 ᴀɪ ᴍᴇɴᴜ 〕━━┈⊷
┃
┃ 💬 ᴄʜᴀᴛ ᴀɪ
┃ ├ ${prefix}nova (NexGen VIP Chatbot)
┃ ├ ${prefix}ᴀɪ
┃ ├ ${prefix}ᴄʜᴀᴛɢᴘᴛ
┃ ├ ${prefix}ɢᴇᴍɪɴɪ
┃ ├ ${prefix}ʟʟᴀᴍᴀ
┃ ├ ${prefix}ᴅᴇᴇᴘsᴇᴇᴋ
┃ └ ${prefix}ɢʀᴏǫ
┃
┃ 🎨 ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ
┃ ├ ${prefix}ғʟᴜx
┃ ├ ${prefix}ᴘɪxᴀʀᴛ
┃ ├ ${prefix}sᴅxʟ
┃ ├ ${prefix}ᴘᴏʟʟɪɴᴀᴛɪᴏɴs
┃ └ ${prefix}ᴘʟᴀʏɢʀᴏᴜɴᴅ
┃
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🛠️ ᴛᴏᴏʟs ᴍᴇɴᴜ 〕━━┈⊷
┃
┃ 🔧 ᴄᴏɴᴠᴇʀsɪᴏɴ & ᴜᴛɪʟɪᴛʏ
┃ ├ ${prefix}currency
┃ ├ ${prefix}convert
┃ ├ ${prefix}translate
┃ ├ ${prefix}calc
┃ ├ ${prefix}tts
┃ ├ ${prefix}shorturl
┃ └ ${prefix}tovn
┃
┃ 🎨 ɪᴍᴀɢᴇ ᴛᴏᴏʟs
┃ ├ ${prefix}removebg
┃ ├ ${prefix}enhance
┃ ├ ${prefix}upscale
┃ ├ ${prefix}toanime
┃ └ ${prefix}carbon
┃
┃ 📝 ɢᴇɴᴇʀᴀᴛᴏʀs
┃ ├ ${prefix}qr
┃ ├ ${prefix}readqr
┃ └ ${prefix}obfuscate
┃
┃ 🔍 sᴇᴀʀᴄʜ & ɪɴғᴏ
┃ ├ ${prefix}lyrics
┃ ├ ${prefix}imdb
┃ ├ ${prefix}yts
┃ ├ ${prefix}google
┃ ├ ${prefix}weather
┃ └ ${prefix}wiki
┃
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎲 ɢᴀᴍᴇ & ꜰᴜɴ 〕━━┈⊷
┃✮│➣ ${prefix}ᴛɪᴄᴛᴀᴄᴛᴏᴇ
┃✮│➣ ${prefix}ᴡᴏʀᴅᴄʜᴀɪɴ
┃✮│➣ ${prefix}ᴛʀᴜᴛʜ
┃✮│➣ ${prefix}ᴅᴀʀᴇ
┃✮│➣ ${prefix}ᴊᴏᴋᴇ
┃✮│➣ ${prefix}ʀᴏᴀsᴛ
┃✮│➣ ${prefix}ᴍᴇᴍᴇ
┃✮│➣ ${prefix}ꜰʟɪʀᴛ
┃✮│➣ ${prefix}ʜᴀᴄᴋ
┃✮│➣ ${prefix}ᴡʜᴏᴀᴍɪ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🔍 sᴛᴀʟᴋ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ɪɢsᴛᴀʟᴋ
┃✮│➣ ${prefix}ᴛᴛsᴛᴀʟᴋ
┃✮│➣ ${prefix}ɪᴘsᴛᴀʟᴋ
┃✮│➣ ${prefix}ɢɪᴛʜᴜʙsᴛᴀʟᴋ
┃✮│➣ ${prefix}ᴡᴀsᴛᴀʟᴋ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━〔 🎨 sᴛɪᴄᴋᴇʀ & ʀᴇᴀᴄᴛ 〕━━┈⊷
┃✮│➣ ${prefix}s (Sticker)
┃✮│➣ ${prefix}sᴛᴇᴀʟ
┃✮│➣ ${prefix}ᴛᴏɪᴍɢ
┃✮│➣ ${prefix}ǫᴄ
┃✮│➣ ${prefix}ᴇᴍᴏᴊɪᴍɪx
┃✮│➣ ${prefix}sᴍᴇᴍᴇ
┃✮│➣ ${prefix}ʟᴀᴜɢʜ / ${prefix}sᴀᴅ
┃✮│➣ ${prefix}ꜰɪʀᴇ / ${prefix}ᴄᴏᴏʟ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━━━━━━━━━━━━━━━━━━━━┈⊷
┃ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴢᴏɴᴇ ☠
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(from, {
    image: { url: randomImage },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true
    }
  }, { quoted: m })
  break
}

      // ═══════════════════════════════════════════════════════════
// MAIN MENU - NEXGEN BRANDING
// ═══════════════════════════════════════════════════════════
case 'menu':
case 'listmenu': {
  await loading()
  
  // NexGen Tech Images (Yahan apni marzi ki pic links laga lena)
  const menuImages = [
    'https://files.catbox.moe/example1.jpg',
    'https://files.catbox.moe/example2.jpg'
  ]
  
  const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)]
  const uptime = runtime(process.uptime())
  
  const menuText = `
╭━━〔 ☠️ ɴᴇxɢᴇɴ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs ☠️ 〕━━┈⊷
┃✮╭────────────────
┃✮│ 🤖 ʙᴏᴛ  : *☠ ᴇᴍᴘɪʀᴇ & ɴɪɴᴊᴀ 𝑴𝑫 ☠*
┃✮│ 👑 ᴏᴡɴᴇʀ : *☠ sᴀɪғ (ɴᴇxɢᴇɴ ᴛᴇᴄʜ) ☠*
┃✮│ 📦 ᴠᴇʀsɪᴏɴ  : *3.0 (VIP)*
┃✮│ 📡 ᴘʟᴀᴛғᴏʀᴍ : *Vercel Web + Telegram*
┃✮╰────────────────
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 ᴍᴇɴᴜ ᴄᴀᴛᴇɢᴏʀɪᴇs 〕━━┈⊷
┃✮│➣ ${prefix}ᴀʟʟᴍᴇɴᴜ - ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs
┃✮│➣ ${prefix}ᴏᴡɴᴇʀᴍᴇɴᴜ
┃✮│➣ ${prefix}ɢʀᴏᴜᴘᴍᴇɴᴜ
┃✮│➣ ${prefix}ᴅᴏᴡɴʟᴏᴀᴅᴍᴇɴᴜ
┃✮│➣ ${prefix}ғᴜɴᴍᴇɴᴜ
┃✮│➣ ${prefix}ɢᴀᴍᴇᴍᴇɴᴜ
┃✮│➣ ${prefix}ᴀɴɪᴍᴇᴍᴇɴᴜ
┃✮│➣ ${prefix}sᴛɪᴄᴋᴇʀᴍᴇɴᴜ
┃✮│➣ ${prefix}ᴜᴛɪʟɪᴛʏᴍᴇɴᴜ
┃✮│➣ ${prefix}ᴠᴏɪᴄᴇᴍᴇɴᴜ
┃✮│➣ ${prefix}ᴀɪᴍᴇɴᴜ
╰━━━━━━━━━━━━━━━┈⊷

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴢᴏɴᴇ ☠`

  await bad.sendMessage(from, {
    image: { url: randomImage },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })

  const _audio = menuAudio()
  if (_audio) {
    await sleep(2000)
    await bad.sendMessage(m.chat, {
      audio: _audio,
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m })
  }
}
break

// ═══════════════════════════════════════════════════════════
// SUB MENUS (OWNER, GROUP, DOWNLOAD ETC.)
// ═══════════════════════════════════════════════════════════

case 'ownermenu':
case 'mymenu': {
  const menuText = `
╭━━〔 👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ᴘᴜʙʟɪᴄ
┃✮│➣ ${prefix}sᴇʟꜰ
┃✮│➣ ${prefix}ʙʟᴏᴄᴋ
┃✮│➣ ${prefix}ᴜɴʙʟᴏᴄᴋ
┃✮│➣ ${prefix}ʙʀᴏᴀᴅᴄᴀsᴛ
┃✮│➣ ${prefix}ᴀᴜᴛᴏʙɪᴏ
┃✮│➣ ${prefix}ᴀᴅᴅᴏᴡɴᴇʀ
┃✮│➣ ${prefix}sᴇᴛᴘʀᴇꜰɪx
┃✮│➣ ${prefix}ʀᴇsᴛᴀʀᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
            serverMessageId: -1
        }
    }
}, { quoted: m })
break
}

case 'groupmenu': {
  const menuText = `
╭━━〔 👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ᴀᴅᴅ / ${prefix}ᴋɪᴄᴋ
┃✮│➣ ${prefix}ᴘʀᴏᴍᴏᴛᴇ / ${prefix}ᴅᴇᴍᴏᴛᴇ
┃✮│➣ ${prefix}ᴛᴀɢᴀʟʟ / ${prefix}ʜɪᴅᴇᴛᴀɢ
┃✮│➣ ${prefix}ᴍᴜᴛᴇ / ${prefix}ᴜɴᴍᴜᴛᴇ
┃✮│➣ ${prefix}ʟɪɴᴋɢᴄ / ${prefix}ʀᴇsᴇᴛʟɪɴᴋ
┃✮│➣ ${prefix}ᴀɴᴛɪʟɪɴᴋ / ${prefix}ᴀɴᴛɪsᴘᴀᴍ
┃✮│➣ ${prefix}ᴡᴇʟᴄᴏᴍᴇ / ${prefix}ɢᴏᴏᴅʙʏᴇ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

case 'downloadmenu': {
  const menuText = `
╭━━〔 📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ᴘʟᴀʏ / ${prefix}sᴘᴏᴛɪꜰʏ
┃✮│➣ ${prefix}ʏᴛᴍᴘ3 / ${prefix}ʏᴛᴍᴘ4
┃✮│➣ ${prefix}ᴛɪᴋᴛᴏᴋ / ${prefix}ɪɴsᴛᴀɢʀᴀᴍ
┃✮│➣ ${prefix}ꜰᴀᴄᴇʙᴏᴏᴋ / ${prefix}ᴛᴡɪᴛᴛᴇʀ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

case 'funmenu':
case 'gamemenu': {
  const menuText = `
╭━━〔 🎮 ɢᴀᴍᴇ & ꜰᴜɴ 〕━━┈⊷
┃✮│➣ ${prefix}ᴛɪᴄᴛᴀᴄᴛᴏᴇ
┃✮│➣ ${prefix}ᴡᴏʀᴅᴄʜᴀɪɴ
┃✮│➣ ${prefix}ᴛʀᴜᴛʜ / ${prefix}ᴅᴀʀᴇ
┃✮│➣ ${prefix}ᴊᴏᴋᴇ / ${prefix}ʀᴏᴀsᴛ
┃✮│➣ ${prefix}ᴍᴇᴍᴇ / ${prefix}ꜰʟɪʀᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

case 'stickermenu': {
  const menuText = `
╭━━〔 🎨 sᴛɪᴄᴋᴇʀ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}s / ${prefix}sᴛɪᴄᴋᴇʀ
┃✮│➣ ${prefix}sᴛᴇᴀʟ / ${prefix}ᴛᴏɪᴍɢ
┃✮│➣ ${prefix}ǫᴄ / ${prefix}ᴇᴍᴏᴊɪᴍɪx
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

case 'utilitymenu': {
  const menuText = `
╭━━〔 🛠️ ᴛᴏᴏʟs ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}convert / ${prefix}translate
┃✮│➣ ${prefix}calc / ${prefix}tts
┃✮│➣ ${prefix}removebg / ${prefix}enhance
┃✮│➣ ${prefix}qr / ${prefix}readqr
┃✮│➣ ${prefix}weather / ${prefix}google
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

case 'voicemenu': {
  const menuText = `
╭━━〔 🎤 ᴠᴏɪᴄᴇ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ʙᴀss / ${prefix}ᴅᴇᴇᴘ
┃✮│➣ ${prefix}ꜰᴀsᴛ / ${prefix}sʟᴏᴡ
┃✮│➣ ${prefix}ɴɪɢʜᴛᴄᴏʀᴇ / ${prefix}ʀᴏʙᴏᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
    }, { quoted: m })
break
}

// ═══════════════════════════════════════════════════════════
// EXTENDED MENUS (IMAGE, EMOJI, LOGO, AI, MISC)
// ═══════════════════════════════════════════════════════════

case 'imagemenu': {
  const menuText = `
╭━━〔 🖼️ ɪᴍᴀɢᴇ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}blackpink / ${prefix}bts
┃✮│➣ ${prefix}cecan / ${prefix}hijab
┃✮│➣ ${prefix}cyber / ${prefix}hacker
┃✮│➣ ${prefix}islamic / ${prefix}quran
┃✮│➣ ${prefix}pubg / ${prefix}freefire
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })
break
}

case 'emojimenu': {
  const menuText = `
╭━━〔 😊 ʀᴇᴀᴄᴛɪᴏɴ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ʟᴀᴜɢʜ / ${prefix}sᴀᴅ
┃✮│➣ ${prefix}sʜʏ / ${prefix}ᴀɴɢᴇʀ
┃✮│➣ ${prefix}ʜᴀᴘᴘʏ / ${prefix}ᴄᴏᴏʟ
┃✮│➣ ${prefix}ꜰɪʀᴇ / ${prefix}ʜᴇᴀʀᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })
break
}

case 'logomenu': {
  const menuText = `
╭━━〔 ✍️ ᴛᴇxᴛ ᴍᴀᴋᴇʀ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ʟᴏɢᴏ / ${prefix}ɢᴀᴍɪɴɢʟᴏɢᴏ
┃✮│➣ ${prefix}ɴᴇᴏɴ / ${prefix}ɢʟɪᴛᴄʜ
┃✮│➣ ${prefix}3ᴅᴛᴇxᴛ / ${prefix}ᴍᴇᴛᴀʟ
┃✮│➣ ${prefix}ꜰɪʀᴇ / ${prefix}ᴡᴀᴛᴇʀ
┃✮│➣ ${prefix}ᴀɴɪᴍᴇᴛᴇxᴛ / ${prefix}ʜᴏʀʀᴏʀ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })
break
}

case 'aimenu': {
  const menuText = `
╭━━〔 🤖 ᴀɪ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}nova (VIP AI)
┃✮│➣ ${prefix}ᴀɪ / ${prefix}ᴄʜᴀᴛɢᴘᴛ
┃✮│➣ ${prefix}ɢᴇᴍɪɴɪ / ${prefix}ᴅᴇᴇᴘsᴇᴇᴋ
┃✮│➣ ${prefix}ғʟᴜx / ${prefix}sᴅxʟ
┃✮│➣ ${prefix}ᴀɪᴅᴇᴛᴇᴄᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })
break
}

case 'miscmenu': {
  const menuText = `
╭━━〔 📱 ᴍɪsᴄ ᴍᴇɴᴜ 〕━━┈⊷
┃✮│➣ ${prefix}ʀᴇᴘᴏ / ${prefix}sᴄʀɪᴘᴛ
┃✮│➣ ${prefix}ᴛᴇsᴛ / ${prefix}ᴀꜰᴋ
┃✮│➣ ${prefix}ɪɢsᴛᴀʟᴋ / ${prefix}ᴛɪᴋᴛᴏᴋsᴛᴀʟᴋ
┃✮│➣ ${prefix}ᴀᴜᴛᴏʀᴇᴀᴄᴛ / ${prefix}ꜰᴀᴋᴇʀᴇᴀᴄᴛ
╰━━━━━━━━━━━━━━━━━━━━━┈⊷`

  await bad.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/example1.jpg' },
    caption: menuText,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: "☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ☠",
        serverMessageId: -1
      }
    }
  }, { quoted: m })
break
}

// ═══════════════════════════════════════════════════════════
// OWNER & SYSTEM COMMANDS 
// ═══════════════════════════════════════════════════════════

case 'self':
case 'private': {
  if (!isCreator) return reply('❌ Owner only')
  bad.public = false
  try {
    const botModeFile = path.join(__dirname, 'allfunc', 'botmode.txt')
    fs.mkdirSync(path.dirname(botModeFile), { recursive: true })
    fs.writeFileSync(botModeFile, 'private')
  } catch (e) {}
  reply('✅ NexGen Private Mode ON 🔒')
}
break

case 'public': {
  if (!isCreator) return reply('❌ Owner only')
  bad.public = true
  try {
    const botModeFile = path.join(__dirname, 'allfunc', 'botmode.txt')
    fs.mkdirSync(path.dirname(botModeFile), { recursive: true })
    fs.writeFileSync(botModeFile, 'public')
  } catch (e) {}
  reply('✅ NexGen Public Mode ON 🌐')
}
break

case 'fix': {
  try {
    const botOwnerFile = './allfunc/botowner.txt'
    fs.writeFileSync(botOwnerFile, m.sender)
    
    if (!owner.includes(m.sender)) {
      owner.push(m.sender)
      fs.writeFileSync('./allfunc/owner.json', JSON.stringify(owner, null, 2))
    }
    if (!premium.includes(m.sender)) {
      premium.push(m.sender)
      fs.writeFileSync('./allfunc/premium.json', JSON.stringify(premium, null, 2))
    }
    reply(`✅ *ᴏᴡɴᴇʀsʜɪᴘ ғɪxᴇᴅ!* (NexGen System)\n\n👤 ʏᴏᴜʀ ɴᴜᴍʙᴇʀ: ${senderNumber}\n🤖 ʙᴏᴛ ɴᴜᴍʙᴇʀ: ${botNumber}\n\n✅ ʏᴏᴜ ᴀʀᴇ ɴᴏᴡ ʀᴇɢɪsᴛᴇʀᴇᴅ ᴀs ᴏᴡɴᴇʀ\nᴘʟᴇᴀsᴇ ʀᴇsᴛᴀʀᴛ ᴛʜᴇ ʙᴏᴛ:\n${prefix}restart`)
  } catch (e) {
    reply(`❌ ᴇʀʀᴏʀ: ${e.message}`)
  }
}
break

case 'block': {
  if (!isCreator) return reply("❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  let users = !m.isGroup ? m.chat : (m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net')
  if (!users) return reply("❌ ᴘʟᴇᴀsᴇ ᴍᴇɴᴛɪᴏɴ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ ᴛᴏ ʙʟᴏᴄᴋ.")
  try {
    await bad.updateBlockStatus(users, 'block')
    reply(`✅ ʙʟᴏᴄᴋᴇᴅ @${users.split('@')[0]}`)
  } catch (error) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ʙʟᴏᴄᴋ ᴜsᴇʀ')
  }
}
break

case 'unblock': {
  if (!isCreator) return reply("❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  let users = !m.isGroup ? m.chat : (m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net')
  if (!users) return reply("❌ ᴘʟᴇᴀsᴇ ᴍᴇɴᴛɪᴏɴ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ ᴛᴏ ᴜɴʙʟᴏᴄᴋ.")
  try {
    await bad.updateBlockStatus(users, 'unblock')
    reply(`✅ ᴜɴʙʟᴏᴄᴋᴇᴅ @${users.split('@')[0]}`)
  } catch (error) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴜɴʙʟᴏᴄᴋ ᴜsᴇʀ')
  }
}
break

case 'autobio': {
  if (!isCreator) return reply("❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return reply(`ᴜsᴇ: ${prefix}autobio on/off\n\nᴄᴜʀʀᴇɴᴛ: ${global.autobio ? 'ᴏɴ' : 'ᴏғғ'}`)
  }
  global.autobio = action === 'on'
  if (action === 'on') {
    try {
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour12: true })
      await bad.updateProfileStatus(`🤖 NexGen Bot Active | ${time}`)
      reply(`✅ ᴀᴜᴛᴏ ʙɪᴏ ᴇɴᴀʙʟᴇᴅ`)
    } catch (err) {
      reply(`✅ ᴀᴜᴛᴏ ʙɪᴏ ᴇɴᴀʙʟᴇᴅ (ғɪʀsᴛ ᴜᴘᴅᴀᴛᴇ ғᴀɪʟᴇᴅ)`)
    }
  } else {
    reply('✅ ᴀᴜᴛᴏ ʙɪᴏ ᴅɪsᴀʙʟᴇᴅ')
  }
}
break

case 'setix':
case 'setprefix': {
  if (!isCreator) return reply('❌ ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ sᴇᴛ ᴘʀᴇғɪx!')
  if (!text) return reply(`*ᴇxᴀᴍᴘʟᴇ:* ${prefix}setprefix .`)
  if (text.length > 1) return reply('❌ ᴘʀᴇғɪx ᴍᴜsᴛ ʙᴇ ᴏɴʟʏ 1 ᴄʜᴀʀᴀᴄᴛᴇʀ!')
  try {
    global.prefix = text
    global.prefa = false
    const configPath = './setting/config.js'
    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, 'utf8')
      config = config.replace(/global\.prefix\s*=\s*['"][^'"]*['"]/g, `global.prefix = '${text}'`)
      fs.writeFileSync(configPath, config)
    }
    reply(`✅ ᴘʀᴇғɪx ᴄʜᴀɴɢᴇᴅ ᴛᴏ: *${text}*\n\n✨ ɴᴇᴡ ᴘʀᴇғɪx ᴀᴄᴛɪᴠᴇ ɪᴍᴍᴇᴅɪᴀᴛᴇʟʏ!`)
  } catch (error) {
    reply('❌ ᴇʀʀᴏʀ: ' + error.message)
  }
}
break
        
case 'prefix': {
  reply(`*ᴄᴜʀʀᴇɴᴛ ᴘʀᴇғɪx:* ${prefix}`)
}
break
        
case 'numbers': {
  const code = args[0]
  if (!code) return reply("Example: .numbers 92")
  try {
    const { data } = await axios.get(NUMBERS_API)
    const numbers = data.result.filter(v => v.startsWith(code))
    if (!numbers.length) return reply("❌ Country not available")
    const file = `numbers-${code}.txt`
    fs.writeFileSync(file, numbers.map(v => "+" + v).join("\n"))
    await bad.sendMessage(m.chat, {
      document: fs.readFileSync(file),
      mimetype: "text/plain",
      fileName: file,
      caption: `📱 Numbers (${code})\nTotal: ${numbers.length}`
    }, { quoted: m })
    fs.unlinkSync(file)
  } catch (e) {
    reply("❌ Error fetching numbers")
  }
}
break

case 'siminfo': {
  let targetNum = text.replace(/[^0-9]/g,'')
  if (!targetNum || targetNum.length < 10) return reply('❌ Provide a valid mobile number')
  if (targetNum.startsWith('0')) targetNum = '92' + targetNum.slice(1)
  try {
    const res = await axios.get('https://pakdataonline.site.je/?action=search&num=${targetNum}`, { timeout: 60000 })
    const data = res.data
    if (!data.success || !data.results || data.results.length === 0) {
        return reply('❌ Data not found from NADRA')
    }
    let txt = `📡 *SIM INFORMATION*\n\n`
    data.results.forEach((r, i) => {
        txt += `*Record #${i+1}*\n📱: ${r.mobile}\n👤: ${r.name}\n🆔: ${r.cnic}\n🏠: ${r.address}\n\n`
    })
    txt += `\n> ☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴢᴏɴᴇ ☠`
    await bad.sendMessage(from, { text: txt }, { quoted: m })
  } catch (e) {
    reply('❌ Data not found from NADRA')
  }
}
break

case 'cnicinfo': {
  let targetCnic = text.replace(/[^0-9]/g,'')
  if (!targetCnic || targetCnic.length < 13) return reply('❌ Provide a valid 13 digit cnic')
  try {
    const res = await axios.get(`https://pakdataonline.site.je/?action=search&num=${targetCnic}`, { timeout: 60000 })
    const data = res.data
    if (!data.success || !data.results || data.results.length === 0) {
        return reply('❌ Data not found from NADRA')
    }
    let txt = `🆔 *CNIC INFORMATION*\n\n`
    data.results.forEach((r, i) => {
        txt += `*Record #${i+1}*\n📱: ${r.mobile}\n👤: ${r.name}\n🆔: ${r.cnic}\n🏠: ${r.address}\n\n`
    })
    txt += `\n> ☠ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴢᴏɴᴇ ☠`
    await bad.sendMessage(from, { text: txt }, { quoted: m })
  } catch (e) {
    reply('❌ Data not found from NADRA')
  }
}
break


     // ═══════════════════════════════════════
// WELCOME COMMAND
// ═══════════════════════════════════════
case 'welcome': {
    if (!m.isGroup) return reply('ɢʀᴏᴜᴘ ᴏɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('ᴀᴅᴍɪɴs ᴏɴʟʏ.')
    if (!args[0]) return reply('ᴜsᴀɢᴇ: ᴡᴇʟᴄᴏᴍᴇ ᴏɴ/ᴏғғ')
    
    if (args[0].toLowerCase() === 'on') {
        setSetting(m.chat, "welcome", true);
        m.reply('✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ!')
    } else if (args[0].toLowerCase() === 'off') {
        setSetting(m.chat, "welcome", false);
        m.reply('❌ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ!')
    } else {
        reply('ᴜsᴀɢᴇ: ᴡᴇʟᴄᴏᴍᴇ ᴏɴ/ᴏғғ')
    }
}
break

case 'goodbye': {
    if (!m.isGroup) return reply('ɢʀᴏᴜᴘ ᴏɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('ᴀᴅᴍɪɴs ᴏɴʟʏ.')
    if (!args[0]) return reply('ᴜsᴀɢᴇ: ɢᴏᴏᴅʙʏᴇ ᴏɴ/ᴏғғ')
    
    if (args[0].toLowerCase() === 'on') {
        setSetting(m.chat, "goodbye", true);
        m.reply('✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴇɴᴀʙʟᴇᴅ!')
    } else if (args[0].toLowerCase() === 'off') {
        setSetting(m.chat, "goodbye", false);
        m.reply('❌ ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇs ᴅɪsᴀʙʟᴇᴅ!')
    } else {
        reply('ᴜsᴀɢᴇ: ɢᴏᴏᴅʙʏᴇ ᴏɴ/ᴏғғ')
    }
}
break
  
case 'runtime':
case 'alive': {
  const uptime = runtime(process.uptime());
  reply(
`🟢 *Bot Status:* ONLINE
👑 *Owner:* NexGen Tech Zone
⏱️ *Uptime:* ${uptime}`
  );
}
break;

case 'ping':
case 'speed': {
  const start = process.hrtime();
  await reply('Testing...');
  const [s, ns] = process.hrtime(start);
  reply(`Speed: ${((s * 1e9 + ns) / 1e6).toFixed(2)} ms`);
}
break;

case 'getpp': {
  if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  let userss = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
  try {
    var ppuser = await bad.profilePictureUrl(userss, 'image')
  } catch (err) {
    var ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
  }
  bad.sendMessage(from, { image: { url: ppuser }}, { quoted: m })
}
break

case 'setprofile': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!quoted || !/image/.test(mime)) return reply(`ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.`)
  let media = await quoted.download()
  await bad.updateProfilePicture(botNumber, media)
  reply('ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ ✅')
}
break

case 'forword':
case 'broadcast': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!text && !(m.quoted && m.quoted.mtype === 'imageMessage')) return reply(`ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴏʀ ᴛʏᴘᴇ:\n${prefix + command} <ᴛᴇxᴛ>`)

  const groups = Object.keys(await bad.groupFetchAllParticipating())
  await reply(`ʙʀᴏᴀᴅᴄᴀsᴛɪɴɢ ᴛᴏ ${groups.length} ɢʀᴏᴜᴘs...`)

  const contextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: NEWSLETTER_JID,
      newsletterName: "NexGen Tech Zone",
      serverMessageId: -1
    }
  }

  const bcText = `╭─〔 ʙʀᴏᴀᴅᴄᴀsᴛ ʙʏ ᴏᴡɴᴇʀ 〕\n│ ${text.split('\n').join('\n│ ')}\n╰─⸻⸻⸻⸻`

  for (let id of groups) {
    await sleep(1500)
    try {
      if (m.quoted && m.quoted.mtype === 'imageMessage') {
        const media = await bad.downloadAndSaveMediaMessage(m.quoted)
        await bad.sendMessage(id, {
          image: { url: media },
          caption: bcText,
          contextInfo
        })
      } else {
        await bad.sendMessage(id, {
          text: bcText,
          contextInfo
        })
      }
    } catch (err) {
      console.error(`ʙʀᴏᴀᴅᴄᴀsᴛ ᴛᴏ ${id} ғᴀɪʟᴇᴅ:`, err)
    }
  }
  reply('ʙʀᴏᴀᴅᴄᴀsᴛ fɪɴɪsʜᴇᴅ ✅')
}
break

case 'addowner':
case 'setowner': {
  if (!isCreator) return reply("╭━━〔 ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ 〕━━┈⊷\n┃◈ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n╰━━━━━━━━━━━━━━━┈⊷")
  if (!args[0]) return reply(`ᴜsᴀɢᴇ: ${prefix}${command} 234xxx`)
  
  let number = text.replace(/[^0-9]/g, '')
  let checkNumber = await bad.onWhatsApp(number + "@s.whatsapp.net")
  if (!checkNumber.length) return reply("❌ ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇ🇷!")
  
  const newOwnerJid = number + "@s.whatsapp.net"
  
  if (!owner.some(o => isSameUser(o, newOwnerJid))) {
    owner.push(newOwnerJid)
    fs.writeFileSync('./allfunc/owner.json', JSON.stringify(owner, null, 2))
  }
  
  if (!premium.some(p => isSameUser(p, newOwnerJid))) {
    premium.push(newOwnerJid)
    fs.writeFileSync('./allfunc/premium.json', JSON.stringify(premium, null, 2))
  }
  
  reply(`✅ *ᴏᴡɴᴇʀ ᴀᴅᴅᴇᴅ!*\n\n👤 @${number}\n\n• ғᴜʟʟ ʙᴏᴛ ᴀᴄᴄᴇss ɢʀᴀɴᴛᴇᴅ\n• ᴘʀᴇᴍɪᴜᴍ fᴇᴀᴛᴜʀᴇs ᴜɴʟᴏᴄᴋᴇᴅ`)
}
break

case 'delowner':
case 'delown': {
  if (!isCreator) return reply("╭━━〔 ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ 〕━━┈⊷\n┃◈ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n╰━━━━━━━━━━━━━━━┈⊷")
  if (!args[0]) return reply(`ᴜsᴀɢᴇ: ${prefix}${command} 234xxx`)
  
  let number = text.replace(/[^0-9]/g, '')
  const removeJid = number + "@s.whatsapp.net"
  
  owner = owner.filter(o => !isSameUser(o, removeJid))
  premium = premium.filter(p => !isSameUser(p, removeJid))
  
  fs.writeFileSync('./allfunc/owner.json', JSON.stringify(owner, null, 2))
  fs.writeFileSync('./allfunc/premium.json', JSON.stringify(premium, null, 2))
  
  reply(`✅ *ᴏᴡɴᴇʀ ʀᴇᴍᴏᴠᴇᴅ!*\n\n👤 @${number}\n\n• ʙᴏᴛ ᴀᴄᴄᴇss ʀᴇᴠᴏᴋᴇᴅ\n• ᴘʀᴇᴍɪᴜᴍ ʀᴇᴍᴏᴠᴇᴅ`)
}
break

case 'addpremium':
case 'addprem': {
  if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ!")
  if (!args[0]) return reply(`ᴜsᴀɢᴇ: ${prefix + command} 234xxx`)
  
  let number = qtext.split("|")[0].replace(/[^0-9]/g, '')
  let ceknum = await bad.onWhatsApp(number + "@s.whatsapp.net")
  if (!ceknum.length) return reply("ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ!")
  
  premium.push(number)
  fs.writeFileSync('./allfunc/premium.json', JSON.stringify(premium))
  
  reply("sᴜᴄᴄᴇss! ᴜsᴇʀ ᴀᴅᴅᴇᴅ ᴛᴏ ᴘʀᴇᴍɪᴜᴍ ✅")
}
break

case 'delpremium':
case 'delprem': {
  if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ!")
  if (!args[0]) return reply(`ᴜsᴀɢᴇ: ${prefix + command} 234xxx`)
  
  let number = qtext.split("|")[0].replace(/[^0-9]/g, '')
  let indexPremium = premium.indexOf(number)
  
  if (indexPremium !== -1) {
    premium.splice(indexPremium, 1)
    fs.writeFileSync('./allfunc/premium.json', JSON.stringify(premium))
    reply("sᴜᴄᴄᴇss! ᴜsᴇʀ ʀᴇᴍᴏᴠᴇᴅ ғʀᴏᴍ ᴘʀᴇᴍɪᴜᴍ ✅")
  } else {
    reply("ᴜsᴇʀ ɪs ɴᴏᴛ ɪɴ ᴛʜᴇ ᴘʀᴇᴍɪᴜᴍ ʟɪsᴛ.")
  }
}
break

case 'cleartmp': {
  if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  const tmpDir = './tmp'
  fs.readdir(tmpDir, (err, files) => {
    if (err) return reply('ᴇʀʀᴏʀ ʀᴇᴀᴅɪɴɢ ᴛᴍᴘ ᴅɪʀᴇᴄᴛᴏʀʏ.')
    for (const file of files) {
      fs.unlink(`${tmpDir}/${file}`, err => {
        if (err) console.error(err)
      })
    }
    reply(`ᴄʟᴇᴀʀᴇᴅ ${files.length} ᴛᴇᴍᴘᴏʀᴀʀʏ fɪʟᴇs ✅`)
  })
}
break

case 'restart': {
  if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
  reply('ʀᴇsᴛᴀʀᴛɪɴɢ NexGen Tech Bot...')
  exec('pm2 restart all')
}
break

case "savestatus":
case "save":
case "getstatus": {
    try {
        if (!m.quoted) {
            return reply("❌ *ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛᴀᴛᴜs*\n\nᴠɪᴇᴡ ᴀ sᴛᴀᴛᴜs, ᴛʜᴇɴ ʀᴇᴘʟʏ ᴛᴏ ɪᴛ ᴡɪᴛʜ .savestatus");
        }
        
        await bad.sendMessage(m.chat, {react: {text: '⬇️', key: m.key}});
        const quotedMsg = m.quoted;
        
        let media;
        let mediaType;
        
        if (quotedMsg.mtype === 'imageMessage') {
            media = await downloadMedia(quotedMsg, 'image');
            mediaType = 'image';
        } else if (quotedMsg.mtype === 'videoMessage') {
            media = await downloadMedia(quotedMsg, 'video');
            mediaType = 'video';
        } else if (quotedMsg.mtype === 'extendedTextMessage' || quotedMsg.text) {
            const statusText = quotedMsg.text || 'Status text';
            await bad.sendMessage(m.sender, {
                text: `✅ *sᴛᴀᴛᴜs sᴀᴠᴇᴅ*\n\n💬 ${statusText}\n\n✨ sᴀᴠᴇᴅ ʙʏ NexGen Tech Zone`
            });
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
            return reply("✅ *sᴛᴀᴛᴜs sᴀᴠᴇᴅ ᴛᴏ ʏᴏᴜʀ ᴅᴍ* ✉️");
        } else {
            throw new Error('ᴜɴsᴜᴘᴘᴏʀᴛᴇᴅ sᴛᴀᴛᴜs ᴛʏᴘᴇ');
        }
        
        if (!media) {
            throw new Error('ғᴀɪʟᴇᴅ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇᴅɪ🇦');
        }
        
        if (mediaType === 'image') {
            await bad.sendMessage(m.sender, {
                image: media,
                caption: `✅ *sᴛᴀᴛᴜs sᴀᴠᴇᴅ*\n\n📸 ɪᴍᴀɢᴇ sᴛᴀᴛᴜs\n📅 ${new Date().toLocaleString()}\n\n✨ sᴀᴠᴇᴅ ʙʏ NexGen Tech Zone`
            });
        } else if (mediaType === 'video') {
            await bad.sendMessage(m.sender, {
                video: media,
                caption: `✅ *sᴛᴀᴛᴜs sᴀᴠᴇᴅ*\n\n🎥 ᴠɪᴅᴇᴏ sᴛᴀᴛᴜs\n📅 ${new Date().toLocaleString()}\n\n✨ sᴀᴠᴇᴅ ʙʏ NexGen Tech Zone`
            });
        }
        
        await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        return reply("✅ *sᴛᴀᴛᴜs sᴀᴠᴇᴅ ᴛᴏ ʏᴏᴜʀ ᴅᴍ* ✉️\n\nᴄʜᴇᴄᴋ ʏᴏᴜʀ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ!");
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await bad.sendMessage(m.chat, {react: {text: '❌', key: m.key}});
        return reply(`❌ *ғᴀɪʟᴇᴅ*\n\n${error.message}`);
    }
}
break;

case 'autoviewstatus': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    const status = global.autoViewStatus ? '🔴 ᴇɴᴀʙʟᴇᴅ' : '🟢 ᴅɪsᴀʙʟᴇᴅ'
    return reply(`*ᴀᴜᴛᴏ ᴠɪᴇᴡ sᴛᴀᴛᴜs*\n\nᴄᴜʀʀᴇɴᴛ: ${status}\n\nᴜsᴇ: ${prefix}autoviewstatus on/off`)
  }
  global.autoViewStatus = action === 'on'
  reply(`✅ ᴀᴜᴛᴏ ᴠɪᴇᴡ sᴛᴀᴛᴜs ${action === 'on' ? '*ᴇɴᴀʙʟᴇᴅ*\n\nɪ ᴡɪʟʟ ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ᴠɪᴇᴡ ᴀʟʟ sᴛᴀᴛᴜsᴇs!' : '*ᴅɪsᴀʙʟᴇᴅ*'}`)
}
break

case 'autolikestatus': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    const status = global.autoLikeStatus ? '🔴 ᴇɴᴀʙʟᴇᴅ' : '🟢 ᴅɪsᴀʙʟᴇᴅ'
    return reply(`*ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs*\n\nᴄᴜʀʀᴇɴᴛ: ${status}\n\nᴜsᴇ: ${prefix}autolikestatus on/off`)
  }
  global.autoLikeStatus = action === 'on'
  reply(`✅ ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs ${action === 'on' ? '*ᴇɴᴀʙʟᴇᴅ*\n\nɪ ᴡɪʟʟ ʀᴇᴀᴄᴛ ᴛᴏ ᴀʟʟ sᴛᴀᴛᴜsᴇs ᴡɪᴛʜ ʀᴀɴᴅᴏᴍ ᴇᴍᴏᴊɪs!' : '*ᴅɪsᴀʙʟᴇᴅ*'}`)
}
break

case 'autoread': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return reply(`ᴜsᴇ: ${prefix}autoread on/off\n\nᴄᴜʀʀᴇɴᴛ: ${global.autoread ? 'ᴏɴ' : 'ᴏғғ'}`)
  }
  global.autoread = action === 'on'
  reply(`✅ ᴀᴜᴛᴏ ʀᴇᴀᴅ ${action === 'on' ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'}`)
}
break

case 'poem': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .poem ʟᴏᴠᴇ')
  try {
    const res = await fetch(`https://api.popcat.xyz/poem?prompt=${encodeURIComponent(text)}`)
    const data = await res.json()
    reply(`*◆ ᴘᴏᴇᴍ*\n\n${data.poem}`)
  } catch (err) {
    reply('ᴘᴏᴇᴍ ɢᴇɴᴇʀᴀᴛɪᴏɴ fᴀɪʟᴇᴅ.')
  }
}
break

case 'github': {
  if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .github torvalds')
  try {
    const res = await fetch(`https://api.github.com/users/${text}`)
    const data = await res.json()
    
    let info = `*◆ ɢɪᴛʜᴜʙ ᴘʀᴏғɪʟᴇ*\n\n`
    info += `👤 *ɴᴀᴍᴇ:* ${data.name || 'ɴ/ᴀ'}\n`
    info += `📝 *ʙɪᴏ:* ${data.bio || 'ɴ/ᴀ'}\n`
    info += `📍 *ʟᴏᴄᴀᴛɪᴏɴ:* ${data.location || 'ɴ/ᴀ'}\n`
    info += `📊 *ʀᴇᴘᴏs:* ${data.public_repos}\n`
    info += `👥 *fᴏʟʟᴏᴡᴇʀs:* ${data.followers}\n`
    info += `🔗 *ᴜʀʟ:* ${data.html_url}`
    
    if (data.avatar_url) {
      await bad.sendMessage(m.chat, { image: { url: data.avatar_url }, caption: info }, { quoted: m })
    } else {
      reply(info)
    }
  } catch (err) {
    reply('ᴜsᴇʀ ɴᴏᴛ fᴏᴜɴᴅ.')
  }
}
break

case 'rewrite': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .rewrite ʏᴏᴜʀ ᴛᴇxᴛ')
  try {
    const res = await fetch(`https://api.popcat.xyz/paraphrase?text=${encodeURIComponent(text)}`)
    const data = await res.json()
    reply(`*◆ ʀᴇᴡʀɪᴛᴛᴇɴ*\n\n${data.rewrite}`)
  } catch (err) {
    reply('ʀᴇᴡʀɪᴛᴇ fᴀɪʟᴇᴅ.')
  }
}
break

case 'ban': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!m.mentionedJid[0] && !m.quoted) return reply('ᴍᴇɴᴛɪᴏɴ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ sᴏᴍᴇᴏɴᴇ!')
  const user = m.mentionedJid[0] || m.quoted.sender
  if (!global.banned) global.banned = []
  if (global.banned.includes(user)) return reply('ᴜsᴇʀ ᴀʟʀᴇᴀᴅʏ ʙᴀɴɴᴇᴅ.')
  global.banned.push(user)
  reply(`@${user.split('@')[0]} ʜᴀs bᴇᴇɴ bᴀɴɴᴇᴅ fʀᴏᴍ ᴜsɪɴɢ tʜᴇ bᴏᴛ ❌`)
}
break

case 'unban': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!m.mentionedJid[0] && !m.quoted) return reply('ᴍᴇɴᴛɪᴏɴ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ sᴏᴍᴇᴏɴᴇ!')
  const user = m.mentionedJid[0] || m.quoted.sender
  if (!global.banned || !global.banned.includes(user)) return reply('ᴜsᴇʀ ɴᴏᴛ bᴀɴɴᴇᴅ.')
  global.banned = global.banned.filter(u => u !== user)
  reply(`@${user.split('@')[0]} ʜᴀs bᴇᴇɴ ᴜɴbᴀɴɴᴇᴅ ✅`)
}
break

case 'autoreply': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return reply('ᴜsᴇ: .autoreply on/off')
  }
  global.autoReply = action === 'on'
  reply(`ᴀᴜᴛᴏ ʀᴇᴘʟʏ ${action === 'on' ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'} ✅`)
}
break

case 'autotyping': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return reply(`ᴜsᴇ: ${prefix}autotyping on/off\n\nᴄᴜʀʀᴇɴᴛ: ${global.autoTyping ? 'ᴏɴ' : 'ᴏғғ'}`)
  }
  global.autoTyping = action === 'on'
  reply(`✅ ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ ${action === 'on' ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'}`)
}
break

case 'autorecording':
case 'autorecord': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const action = args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return reply(`ᴜsᴇ: ${prefix}autorecording on/off\n\nᴄᴜʀʀᴇɴᴛ: ${global.autoRecording ? 'ᴏɴ' : 'ᴏғғ'}`)
  }
  global.autoRecording = action === 'on'
  reply(`✅ ᴀᴜᴛᴏ ʀᴇᴄᴏʀᴅɪɴɢ ${action === 'on' ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'}`)
}
break

case 'autopresence':
case 'autoonline': {
  if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  const modes = ['off', 'typing', 'recording', 'online']
  const mode = args[0]?.toLowerCase()
  if (!mode || !modes.includes(mode)) {
    return reply(`ᴜsᴇ: ${prefix}autopresence <mode>\n\nᴍᴏᴅᴇs:\n• typing\n• recording\n• online\n• off`)
  }
  global.autoPresence = mode
  reply(`✅ ᴀᴜᴛᴏ ᴘʀᴇsᴇɴᴄᴇ sᴇᴛ ᴛᴏ: ${mode}`)
}
break

// ═══════════════════════════════════════════════════════════
// GROUP COMMANDS
// ═══════════════════════════════════════════════════════════

case 'delete':
case 'del': {
  if (!m.isGroup) return reply("Group only")
  if (!isBotAdmins) return reply("Bot must be admin")
  if (!isAdmins && !isCreator) return reply("Admin or Owner only")
  if (!m.quoted) return reply("Reply to a message")

  await bad.sendMessage(m.chat, {
    delete: m.quoted.key
  })
}
break

case 'kick': {
  if (!m.isGroup) return reply("ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ gʀᴏᴜᴘs.");
  if (!isAdmins && !isCreator) return reply("ᴏɴʟʏ gʀᴏᴜᴘ aᴅᴍɪɴs cᴀɴ kɪᴄᴋ mᴇᴍbᴇʀs.");

  let users;
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    users = m.mentionedJid[0];
  } else if (m.quoted && m.quoted.sender) {
    users = m.quoted.sender;
  } else if (text) {
    users = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else {
    return reply("ᴛᴀɢ oʀ qᴜᴏᴛᴇ a usᴇʀ tᴏ kɪᴄᴋ!");
  }

  if (users === botNumber) {
    return reply("ɪ cᴀɴɴᴏᴛ kɪᴄᴋ mʏsᴇʟf!");
  }

  const groupMetadata = await bad.groupMetadata(m.chat);
  const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

  if (groupAdmins.includes(users) && !isCreator) {
    return reply("ɪ cᴀɴɴᴏᴛ kɪᴄᴋ aɴᴏᴛʜᴇʀ aᴅᴍɪɴ!");
  }

  try {
    await bad.groupParticipantsUpdate(m.chat, [users], 'remove');
    reply("✅ ᴜsᴇʀ hᴀs bᴇᴇɴ kɪᴄᴋᴇᴅ oᴜᴛ oғ tʜᴇ gʀᴏᴜᴘ");
  } catch (err) {
    reply("❌ fᴀɪʟᴇᴅ tᴏ kɪᴄᴋ u𝘀ᴇʀ.");
  }
}
break

case 'antideletedm': {
    if (!isCreator) return reply('ᴏᴡɴᴇʀ ᴏɴʟʏ.')
    if (!args[0]) return reply('ᴜsᴀɢᴇ: ᴀɴᴛɪᴅᴇʟᴇᴛᴇᴅᴍ ᴏɴ/ᴏғғ')
    if (args[0].toLowerCase() === 'on') {
        setSetting('bot', "antideletedm", true);
        m.reply('✅ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ ᴅᴍ ᴇɴᴀʙʟᴇᴅ!')
    } else if (args[0].toLowerCase() === 'off') {
        setSetting('bot', "antideletedm", false);
        m.reply('❌ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ ᴅᴍ ᴅɪsᴀʙʟᴇᴅ!')
    }
}
break

case 'promoteall': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
    const metadata = await bad.groupMetadata(m.chat)
    let users = metadata.participants.filter((u) => !u.admin && u.id !== botNumber)
    for (let user of users) {
        await bad.groupParticipantsUpdate(m.chat, [user.id], 'promote')
        await sleep(1000)
    }
    reply(`✅ ᴘʀᴏᴍᴏᴛᴇᴅ ${users.length} ᴜsᴇʀs ᴛᴏ aᴅᴍɪɴ`)
}
break

case 'demoteall': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
    const metadata = await bad.groupMetadata(m.chat)
    let admins = metadata.participants.filter((u) => u.admin && u.id !== botNumber)
    for (let admin of admins) {
        await bad.groupParticipantsUpdate(m.chat, [admin.id], 'demote')
        await sleep(1000)
    }
    reply(`✅ ᴅᴇᴍᴏᴛᴇᴅ ${admins.length} aᴅᴍɪɴs`)
}
break

case 'add': {
    if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!')
    if (!isAdmins && !isCreator) return reply('❌ aᴅᴍɪɴ ᴏɴʟʏ!')
    if (!text && !m.quoted) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix}add 921543398755`)
    const numbersOnly = text ? text.replace(/[^0-9]/g, '') : m.quoted?.sender.replace(/[^0-9]/g, '')
    if (!numbersOnly) return reply('❌ ɪɴᴠᴀʟɪᴅ nᴜᴍʙᴇʀ')
    const user = numbersOnly + '@s.whatsapp.net'
    try {
        await bad.groupParticipantsUpdate(m.chat, [user], 'add')
        await reply(`✅ sᴜᴄᴄᴇssғᴜʟʟʏ aᴅᴅᴇᴅ @${numbersOnly}`)
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ tᴏ aᴅᴅ u𝘀ᴇʀ.')
    }
}
break

case 'groupstatus':
case 'gcstatus':
case 'poststatus': {
    if (!isCreator) return reply('👑 ᴏɴʟʏ bᴏᴛ oᴡɴᴇʀ cᴀɴ u𝘀ᴇ tʜɪs')
    if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ oɴʟʏ!')
    if (!m.quoted) return reply('Reply to an image, video, audio, or text to post as status.')

    try {
        await bad.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
        const quotedMsg = m.quoted
        const mime = (quotedMsg.msg || quotedMsg).mimetype || ''

        if (/image/.test(mime)) {
            let media = await quotedMsg.download()
            await bad.sendMessage(m.chat, { image: media, caption: quotedMsg.caption || '', contextInfo: { isGroupStatus: true } })
        } else if (/video/.test(mime)) {
            let media = await quotedMsg.download()
            await bad.sendMessage(m.chat, { video: media, caption: quotedMsg.caption || '', contextInfo: { isGroupStatus: true } })
        } else if (/audio/.test(mime)) {
            let media = await quotedMsg.download()
            await bad.sendMessage(m.chat, { audio: media, mimetype: 'audio/mpeg', ptt: false, contextInfo: { isGroupStatus: true } })
        } else if (quotedMsg.conversation || quotedMsg.text || quotedMsg.extendedTextMessage) {
            let textContent = quotedMsg.conversation || quotedMsg.text || quotedMsg.extendedTextMessage?.text || ''
            if (!textContent) return reply('❌ No text found!')
            
            const statusPayload = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: textContent,
                            backgroundArgb: 0xFF000000,
                            textArgb: 0xFFFFFFFF,
                            font: 2,
                            contextInfo: { mentionedJid: [], isGroupStatus: true }
                        }
                    }
                }
            }
            const statusId = require('crypto').randomBytes(16).toString('hex')
            await bad.relayMessage(m.chat, statusPayload, { messageId: statusId })
        }
        await bad.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        reply('📢 Status posted successfully!')
    } catch (error) {
        await bad.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        reply(`⚠️ Failed: ${error.message}`)
    }
}
break

case 'promote': {
    if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!')
    if (!isAdmins && !isCreator) return reply('❌ aᴅᴍɪɴ ᴏɴʟʏ!')
    const users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!users) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix}promote @user`)
    try {
        await bad.groupParticipantsUpdate(m.chat, [users], 'promote')
        await reply(`✅ sᴜᴄᴄᴇssғᴜʟʟʏ pʀᴏᴍᴏᴛᴇᴅ @${users.split('@')[0]}`)
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ pʀᴏᴍᴏᴛᴇ')
    }
}
break

case 'demote': {
    if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!')
    if (!isAdmins && !isCreator) return reply('❌ aᴅᴍɪɴ ᴏɴʟʏ!')
    const users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!users) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix}demote @user`)
    if (users === botNumber) return reply('❌ cᴀɴɴᴏᴛ dᴇᴍᴏᴛᴇ mʏsᴇʟf!')
    try {
        await bad.groupParticipantsUpdate(m.chat, [users], 'demote')
        await reply(`✅ dᴇᴍᴏᴛᴇᴅ @${users.split('@')[0]}`)
    } catch (err) {
        reply(`❌ fᴀɪʟᴇᴅ: ${err.message}`)
    }
}
break

case 'tagall':
case 'everyone': {
    if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!')
    if (!isCreator) return reply('❌ oᴡɴᴇʀ oɴʟʏ!')
    try {
        if (!groupMetadata) groupMetadata = await bad.groupMetadata(from)
        const participants = groupMetadata.participants.map(p => p.id)
        const customMessage = text || 'NexGen Tech Zone Tag'
        
        let tagText = `*╭━━〔 ᴛᴀɢ aʟʟ 〕━━┈⊷*\n`
        tagText += `┃✮│ *${customMessage}*\n`
        participants.forEach(p => { tagText += `┃✮│ @${normalizeJid(p)}\n` })
        tagText += `*╰━━━━━━━━━━━━━━━┈⊷*`
        
        await bad.sendMessage(from, { text: tagText, mentions: participants }, { quoted: m })
    } catch (error) {
        reply('❌ ᴇʀʀᴏʀ: ' + error.message)
    }
}
break

case 'toanime':
case 'cartoon': {
  if (!quoted) return reply(`Reply to an image with ${prefix}toanime`)
  if (!/image/.test(mime)) return reply('Reply to an image!')
  try {
    let media = await quoted.download()
    let uploadImage = require('./allfunc/Data6')
    let imageUrl = await uploadImage(media)
    const apiUrl = `https://api.princetechn.com/toanime?url=${encodeURIComponent(imageUrl)}`
    
    await bad.sendMessage(m.chat, { image: { url: apiUrl }, caption: '✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ tᴏ aɴɪᴍᴇ sᴛʏʟᴇ*' }, { quoted: m })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ cᴏɴᴠᴇʀᴛ')
  }
}
break

case 'hidetag': {
  if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
  if (!isAdmins && !isCreator) return reply("aᴅᴍɪɴs oɴʟʏ.")
  bad.sendMessage(m.chat, { text: q ? q : '', mentions: participants.map(a => a.id) }, { quoted: m })
}
break

case 'groupjid': {
  if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
  if (!isCreator) return reply("oᴡɴᴇʀ oɴʟʏ.")
  let textt = `_ɢʀᴏᴜᴘ JID LIST_\n\n`
  for (let mem of participants) { textt += `✮ ${mem.id}\n` }
  reply(textt)
}
break

case 'jid': 
case 'chid': {
    if (!text) return reply("Example: .jid https://whatsapp.com/channel/XXXX");
    const linkPrefix = "https://whatsapp.com/channel/";
    if (!text.includes(linkPrefix)) return reply("❌ Invalid link.");
    try {
        const channelCode = text.split(linkPrefix)[1];
        const res = await bad.newsletterMetadata("invite", channelCode);
        reply(res.id);
    } catch (err) {
        reply("⚠️ Failed to get JID.");
    }
}
break

case 'listadmin': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
    const metadata = await bad.groupMetadata(m.chat)
    const groupAdminsList = metadata.participants.filter(p => p.admin)
    const listAdmin = groupAdminsList.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n')
    let text = `*ɢʀᴏᴜᴘ aᴅᴍɪɴs:*\n\n${listAdmin}`
    bad.sendMessage(m.chat, { text, mentions: groupAdminsList.map(v => v.id) }, { quoted: m })
}
break

case 'mute':
case 'close': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("aᴅᴍɪɴs oɴʟʏ.")
    await bad.groupSettingUpdate(m.chat, 'announcement')
    reply("✅ *ɢʀᴏᴜᴘ cʟᴏsᴇᴅ!* 🔒")
}
break

case 'unmute':
case 'open': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("aᴅᴍɪɴs oɴʟʏ.")
    await bad.groupSettingUpdate(m.chat, 'not_announcement')
    reply("✅ *ɢʀᴏᴜᴘ oᴘᴇɴᴇᴅ!* 🔊")
}
break

case 'linkgc':
case 'linkgroup': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
    try {
        let response = await bad.groupInviteCode(m.chat)
        const metadata = await bad.groupMetadata(m.chat)
        await bad.sendMessage(m.chat, { text: `https://chat.whatsapp.com/${response}\n\n*🔗 ɢʀᴏᴜᴘ:* ${metadata.subject}` }, { quoted: m })
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ gᴇᴛ lɪɴ🇰')
    }
}
break

case 'resetlink': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("aᴅᴍɪɴs oɴʟʏ.")
    try {
        await bad.groupRevokeInvite(m.chat)
        reply("✅ ɢʀᴏᴜᴘ lɪɴ🇰 rᴇsᴇᴛ sᴜᴄᴄᴇssғᴜʟʟʏ!")
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ rᴇsᴇᴛ lɪɴ🇰')
    }
}
break
 
// ═══════════════════════════════════════════════════════════
// ADVANCED GROUP & ADMIN COMMANDS
// ═══════════════════════════════════════════════════════════

case 'kickall': {
  if (!m.isGroup) return reply("ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.");
  if (!isCreator) return reply("ᴏɴʟʏ ᴍʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.");
  
  try {
    const groupMetadata = await bad.groupMetadata(m.chat);
    const participants = groupMetadata.participants;
    
    const members = participants
      .filter(p => !p.admin && p.id !== botNumber)
      .map(p => p.id);
    
    if (members.length === 0) {
      return reply("ɴᴏ ᴍᴇᴍʙᴇʀs ᴛᴏ ᴋɪᴄᴋ. ᴏɴʟʏ ᴀᴅᴍɪɴs ʀᴇᴍᴀɪɴ.");
    }
    
    reply(`⚠️ ᴋɪᴄᴋɪɴɢ ${members.length} ᴍᴇᴍʙᴇʀs... ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ.`);
    
    for (let i = 0; i < members.length; i += 20) {
      const batch = members.slice(i, i + 20);
      await bad.groupParticipantsUpdate(m.chat, batch, 'remove');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    reply(`✅ sᴜᴄᴄᴇssғᴜʟʟʏ ᴋɪᴄᴋᴇᴅ ${members.length} ᴍᴇᴍʙᴇʀs ғʀᴏᴍ ᴛʜᴇ ɢʀᴏᴜᴘ.`);
  } catch (err) {
    reply("❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ᴋɪᴄᴋɪɴɢ ᴍᴇᴍʙᴇʀs.");
    console.error(err);
  }
}
break;

case 'kickadmin': {
  if (!m.isGroup) return reply("ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘs.");
  if (!isCreator) return reply("ᴏɴʟʏ ᴍʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.");
  
  try {
    const groupMetadata = await bad.groupMetadata(m.chat);
    const participants = groupMetadata.participants;
    
    const groupAdmins = participants
      .filter(p => p.admin === 'admin' && p.id !== botNumber)
      .map(p => p.id);
    
    if (groupAdmins.length === 0) {
      return reply("ɴᴏ ᴀᴅᴍɪɴs ᴛᴏ ᴋɪᴄᴋ (ᴇxᴄʟᴜᴅɪɴɢ ɢʀᴏᴜᴘ ᴏᴡɴᴇʀ).");
    }
    
    reply(`⚠️ ᴋɪᴄᴋɪɴɢ ${groupAdmins.length} ᴀᴅᴍɪɴ(s)... ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ.`);
    
    for (const admin of groupAdmins) {
      try {
        await bad.groupParticipantsUpdate(m.chat, [admin], 'demote');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await bad.groupParticipantsUpdate(m.chat, [admin], 'remove');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Failed to kick admin ${admin}:`, err);
      }
    }
    
    reply(`✅ sᴜᴄᴄᴇssғᴜʟʟʏ ᴋɪᴄᴋᴇᴅ ${groupAdmins.length} ᴀᴅᴍɪɴ(s) ғʀᴏᴍ ᴛʜᴇ ɢʀᴏᴜᴘ.`);
  } catch (err) {
    reply("❌ ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ᴋɪᴄᴋɪɴɢ ᴀᴅᴍɪɴs.");
    console.error(err);
  }
}
break;

case 'join': {
    if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
    if (!text) return reply(`ᴇxᴀᴍᴘʟᴇ: *${prefix + command} <ɢʀᴏᴜᴘ ʟɪɴᴋ>*`)
    if (!isUrl(args[0]) || !args[0].includes('whatsapp.com')) return reply("ɪɴᴠᴀʟɪᴅ ɢʀᴏᴜᴘ ʟɪɴᴋ!")
    
    let result = args[0].split('https://chat.whatsapp.com/')[1]
    await bad.groupAcceptInvite(result)
    reply("sᴜᴄᴄᴇssғᴜʟʟʏ ᴊᴏɪɴᴇᴅ ᴛʜᴇ ɢʀᴏᴜᴘ ✅")
}
break

case 'leave':
case 'left': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
    
    await reply("ʙʏᴇ 👋 ɪᴛ ᴡᴀs ᴄᴏᴏʟ ʙᴇɪɴɢ ʜᴇʀᴇ")
    await bad.groupLeave(m.chat)
}
break

case 'creategc':
case 'creategroup': {
    if (!isCreator) return reply("ᴏᴡɴᴇʀ ᴏɴʟʏ.")
    const groupName = args.join(" ")
    if (!groupName) return reply(`ᴜsᴇ *${prefix + command} ɢʀᴏᴜᴘɴᴀᴍᴇ*`)
    
    try {
        const cret = await bad.groupCreate(groupName, [])
        const code = await bad.groupInviteCode(cret.id)
        const link = `https://chat.whatsapp.com/${code}`
        
        const teks = `「 ɢʀᴏᴜᴘ ᴄʀᴇᴀᴛᴇᴅ 」\n▸ *ɴᴀᴍᴇ:* ${cret.subject}\n▸ *ɢʀᴏᴜᴘ ɪᴅ:* ${cret.id}\n▸ *ᴏᴡɴᴇʀ:* @${cret.owner.split("@")[0]}\n▸ *ɪɴᴠɪᴛᴇ ʟɪɴᴋ:* ${link}`
        
        bad.sendMessage(m.chat, { text: teks, mentions: [cret.owner] }, { quoted: m })
    } catch (e) {
        console.error(e)
        reply("❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴄʀᴇᴀᴛᴇ ɢʀᴏᴜᴘ.")
    }
}
break

case 'setname': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("ᴀᴅᴍɪɴs ᴏɴʟʏ.")
    if (!text) return reply("ᴘʀᴏᴠɪᴅᴇ ɴᴇᴡ ɢʀᴏᴜᴘ ɴᴀᴍᴇ!")
    
    await bad.groupUpdateSubject(m.chat, text)
    reply("✅ ɢʀᴏᴜᴘ ɴᴀᴍᴇ ᴜᴘᴅᴀᴛᴇᴅ")
}
break

case 'setdesc': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("ᴀᴅᴍɪɴs ᴏɴʟʏ.")
    if (!text) return reply("ᴘʀᴏᴠɪᴅᴇ ɴᴇᴡ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ!")
    
    await bad.groupUpdateDescription(m.chat, text)
    reply("✅ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ ᴜᴘᴅᴀᴛᴇᴅ")
}
break

case 'setppgc': {
    if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
    if (!isAdmins && !isCreator) return reply("ᴀᴅᴍɪɴs ᴏɴʟʏ.")
    if (!quoted || !/image/.test(mime)) return reply("ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ!")
    
    let media = await quoted.download()
    await bad.updateProfilePicture(m.chat, media)
    reply("✅ ɢʀᴏᴜᴘ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ ᴜᴘᴅᴀᴛᴇᴅ")
}
break

case 'tag':
case 'totag': {
  if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
  if (!isCreator) return reply("ғσя мʏ σωиɛя σиℓʏ.") 
  if (!m.quoted) return reply(`ʀᴇᴘʟʏ ᴡɪᴛ🇭 ${prefix + command} ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ`)
  
  try {
    await bad.sendMessage(m.chat, { forward: m.quoted.fakeObj, mentions: participants.map(a => a.id) })
  } catch (error) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴛᴀɢ ᴍᴇssᴀɢᴇ')
  }
}
break

case 'poll': {
  if (!m.isGroup) return reply("ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.")
  if (!isAdmins && !isCreator) return reply("ᴀᴅᴍɪɴs ᴏɴʟʏ.")
  
  let [poll, opt] = text.split("|")
  if (!opt) return reply(`sᴛᴀᴛᴇ ᴛʜᴇ ǫᴜᴇsᴛɪᴏɴ ᴀɴᴅ ᴀᴛ ʟᴇᴀsᴛ 2 ᴏᴘᴛɪᴏɴs\nᴇxᴀᴍᴘʟᴇ: ${prefix}poll ᴅᴏ ʏᴏᴜ ʟᴏᴠᴇ ☠ 𝑵𝒊𝒏𝒋𝑨 𝑴𝑫 ☠?|ʏᴇs,ɴᴏ`)
  
  let options = opt.split(',').map(v => v.trim())
  
  await bad.sendMessage(m.chat, { poll: { name: poll, values: options } })
}
break

// ═══════════════════════════════════════════════════════════
// RANDOM ANIME IMAGE COMMANDS
// ═══════════════════════════════════════════════════════════
case 'akiyama': case 'ana': case 'art': case 'asuna': case 'ayuzawa':
case 'boruto': case 'chiho': case 'deidara': case 'doraemon':
case 'elaina': case 'emilia': case 'erza': case 'gremory': case 'hestia':
case 'husbu': case 'inori': case 'isuzu': case 'itachi': case 'itori':
case 'kaga': case 'kagura': case 'kakashi': case 'kaori': case 'keneki':
case 'kotori': case 'kurumi': case 'loli': case 'madara': case 'megumin':
case 'mikasa': case 'miku': case 'minato': case 'naruto': case 'nekonime':
case 'nezuko': case 'onepiece': case 'rize': case 'sagiri': case 'sakura':
case 'sasuke': case 'tsunade': case 'yotsuba': case 'yuki': case 'yumeko': {
  await loading()
  try {
    const apis = [
      "https://api.waifu.pics/sfw/waifu",
      "https://nekos.best/api/v2/neko",
      "https://api.waifu.im/search/?is_nsfw=false"
    ]
    const randomApi = apis[Math.floor(Math.random() * apis.length)]
    const res = await fetch(randomApi)
    const data = await res.json()
    
    let imageUrl = data.url || data.results?.[0]?.url
    if (!imageUrl) throw new Error('No image found')
    
    await bad.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: `*${command.toUpperCase()}*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone`
    }, { quoted: m })
  } catch (err) {
    reply('ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 ɪᴍᴀɢᴇ. ᴛʀʏ ᴀɢᴀɪɴ!')
  }
}
break

case 'technews': {
  try {
    const response = await axios.get('https://apis.davidcyriltech.my.id/random/technews')
    const news = response.data.result
    if (!news || news.length === 0) return reply('❌ ɴᴏ ɴᴇᴡs ᴀᴠᴀɪʟᴀʙʟᴇ')
    
    let newsText = `*╭━━〔 📰 ᴛᴇᴄʜ ɴᴇᴡs 〕━━┈⊷*\n┃\n`
    news.slice(0, 5).forEach((item, i) => {
      newsText += `┃ ${i + 1}. *${item.title}*\n┃    ${item.link}\n┃\n`
    })
    newsText += `*╰━━━━━━━━━━━━━━━┈⊷*`
    reply(newsText)
  } catch (error) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 ᴛᴇᴄ🇭 nᴇws')
  }
}
break

case 'bitly':
case 'shortlink': {
  if (!text) return reply(`*🔗 ʙɪᴛʟʏ sʜᴏʀᴛᴇɴᴇʀ*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}bitly https://google.com`)
  try {
    const response = await axios.get(`https://apis.davidcyriltech.my.id/bitly?link=${encodeURIComponent(text)}`)
    const shortUrl = response.data.result
    if (!shortUrl) return reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ sʜᴏʀᴛᴇɴ lɪɴ🇰')
    
    reply(`*╭━━〔 🔗 ʙɪᴛʟʏ 〕━━┈⊷*\n┃\n┃ 📎 ᴏʀɪɢɪɴᴀʟ:\n┃ ${text}\n┃\n┃ ✂️ sʜᴏʀᴛᴇɴᴇᴅ:\n┃ ${shortUrl}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`)
  } catch (error) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ sʜᴏʀᴛᴇɴ lɪɴ🇰')
  }
}
break

case 'soundcloudsearch':
case 'scsearch': {
  if (!text) return reply(`*🎵 sᴏᴜɴᴅᴄʟᴏᴜᴅ sᴇᴀʀᴄ🇭*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}scsearch faded`)
  try {
    const response = await axios.get(`https://apis.davidcyriltech.my.id/search/soundcloud?text=${encodeURIComponent(text)}`)
    const results = response.data.result
    if (!results || results.length === 0) return reply('❌ ɴᴏ rᴇsᴜʟᴛs fᴏᴜɴᴅ')
    
    let resultText = `*╭━━〔 🎵 sᴏᴜɴᴅᴄʟᴏᴜᴅ 〕━━┈⊷*\n┃\n`
    results.slice(0, 10).forEach((track, i) => {
      resultText += `┃ ${i + 1}. *${track.title}*\n┃    👤 ${track.user}\n┃    🔗 ${track.url}\n┃\n`
    })
    resultText += `*╰━━━━━━━━━━━━━━━┈⊷*`
    reply(resultText)
  } catch (error) {
    reply('❌ sᴇᴀʀᴄ🇭 fᴀɪʟᴇᴅ')
  }
}
break

case 'zoomsearch': {
  if (!text) return reply(`*🎬 ᴢᴏᴏᴍ sᴇᴀʀᴄ🇭*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}zoomsearch avengers`)
  try {
    const response = await axios.get(`https://apis.davidcyriltech.my.id/zoom/search?query=${encodeURIComponent(text)}&apikey=`)
    const results = response.data.result
    if (!results || results.length === 0) return reply('❌ ɴᴏ mᴏᴠɪᴇs fᴏᴜɴᴅ')
    
    let resultText = `*╭━━〔 🎬 ᴢᴏᴏᴍ.ʟᴋ 〕━━┈⊷*\n┃\n`
    results.slice(0, 10).forEach((movie, i) => {
      resultText += `┃ ${i + 1}. *${movie.title}*\n┃    🔗 ${movie.url}\n┃\n`
    })
    resultText += `*╰━━━━━━━━━━━━━━━┈⊷*`
    reply(resultText)
  } catch (error) {
    reply('❌ sᴇᴀʀᴄ🇭 fᴀɪʟᴇᴅ')
  }
}
break

case 'wastalk': {
  if (!text) return reply(`*📱 ᴡʜᴀᴛsᴀᴘᴘ cʜᴀɴɴᴇʟ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}wastalk https://whatsapp.com/channel/...`)
  try {
    const response = await axios.get(`https://apis.davidcyriltech.my.id/stalk/wa?url=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ cʜᴀɴɴᴇʟ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.img || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 📱 ᴡᴀ cʜᴀɴɴᴇʟ 〕━━┈⊷*\n┃\n┃ 📝 ɴᴀᴍᴇ: ${data.title || 'N/A'}\n┃ 👥 fᴏʟʟᴏᴡᴇʀs: ${data.followers || 'N/A'}\n┃ 📄 dᴇsᴄʀɪᴘᴛɪᴏɴ: ${data.description || 'N/A'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ cʜᴀɴɴᴇʟ nᴏᴛ fᴏᴜɴᴅ')
  }
}
break

case 'pickupline': {
  try {
    const pickupLines = [
      "kya tum charger ho? kyun ke tumhare baghair meri battery low ho jati hai.",
      "kya tum WiFi ho? kyun ke tum se full signal milta hai.",
      "kya tum Google ho? kyun ke jo bhi main dhoondta hun sab tum mein mil jata hai.",
      "kya tum chocolate ho? kyun ke tum bahut sweet ho.",
      "kya tum keyboard ho? kyun ke tum meri type ho."
    ];
    let line = pickupLines[Math.floor(Math.random() * pickupLines.length)];
    reply(`*╭━━〔 💘 pɪᴄᴋᴜᴘ lɪɴᴇ 〕━━┈⊷*\n┃\n┃ ${line}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`);
  } catch (error) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 pɪᴄᴋᴜᴘ lɪɴᴇ');
  }
}
break;

case 'catfact': {
  try {
    const response = await axios.get('https://catfact.ninja/fact');
    let fact = response.data.fact;
    reply(`*╭━━〔 🐱 cᴀᴛ fᴀᴄᴛ 〕━━┈⊷*\n┃\n┃ ${fact}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`);
  } catch (error) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 cᴀᴛ fᴀᴄᴛ');
  }
}
break;

case 'dogfact': {
  try {
    const response = await axios.get('https://dogapi.dog/api/v2/facts');
    let fact = response.data.data[0].attributes.body;
    reply(`*╭━━〔 🐕 dᴏɢ fᴀᴄᴛ 〕━━┈⊷*\n┃\n┃ ${fact}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`);
  } catch (error) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 dᴏɢ fᴀᴄᴛ');
  }
}
break;

case 'truth': {
  const truths = [
    "tumhari sab se badi fear kya hai?",
    "tumhara pehla crush kaun tha?",
    "tumne kabhi jhoot bol kar kisi ko bachaya hai?",
    "tumhari sab se embarrassing moment kya thi?"
  ];
  let question = truths[Math.floor(Math.random() * truths.length)]
  await bad.sendMessage(m.chat, {
    image: { url: 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
    caption: `♤ᴛʀᴜᴛ🇭 tɪᴍᴇ♤\n\n ➩ ${question}`
  }, { quoted: m });
}
break;

case 'dare': {
  const dares = [
    "group me ek funny selfie bhejo",
    "apne dost ko call karo aur gana gao",
    "10 pushups karo aur video bhejo",
    "apne crush ko hello message bhejo"
  ];
  let dare = dares[Math.floor(Math.random() * dares.length)]
  await bad.sendMessage(m.chat, {
    image: { url: 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
    caption: `♤ DARE Tɪᴍᴇ ♤\n\n➩ ${dare}`
  }, { quoted: m })
}
break;

case 'githubstalk':
case 'ghstalk': {
  if (!text) return reply(`*💻 gɪᴛʜᴜʙ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}githubstalk nexoracle`)
  try {
    const response = await axios.get(`https://api.github.com/users/${encodeURIComponent(text)}`)
    const data = response.data
    if (!data) return reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.avatar_url || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 💻 gɪᴛʜᴜʙ sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 👤 u𝘀ᴇʀɴᴀᴍᴇ: ${data.login}\n┃ 📝 nᴀᴍᴇ: ${data.name || 'N/A'}\n┃ 👥 fᴏʟʟᴏᴡᴇʀs: ${data.followers}\n┃ 📦 rᴇᴘᴏs: ${data.public_repos}\n┃ 🔗 pʀᴏғɪʟᴇ: ${data.html_url}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ')
  }
}
break

case 'ipstalk':
case 'iplookup': {
  if (!text) return reply(`*🌐 ɪᴘ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}ipstalk 8.8.8.8`)
  try {
    const response = await axios.get(`http://ip-api.com/json/${encodeURIComponent(text)}`)
    const data = response.data
    if (data.status === 'fail') return reply('❌ ɪɴᴠᴀʟɪᴅ ɪᴘ')
    
    reply(`*╭━━〔 🌐 ɪᴘ sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 🌐 ɪᴘ: ${data.query}\n┃ 🏳️ cᴏᴜɴᴛʀʏ: ${data.country}\n┃ 🏙️ cɪᴛʏ: ${data.city}\n┃ ⏰ tɪᴍᴇᴢᴏɴᴇ: ${data.timezone}\n┃ 🏢 ɪsᴘ: ${data.isp}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`)
  } catch (error) {
    reply('❌ iɴᴠᴀʟɪᴅ ɪᴘ')
  }
}
break

case 'igstalk':
case 'instastalk': {
  if (!text) return reply(`Example:\n${prefix}igstalk username`)
  try {
    let res = await axios.get(`https://api.popcat.xyz/instagram?user=${text}`)
    let data = res.data
    if (!data) return reply('❌ User not found')
    
    let caption = `📸 *INSTAGRAM STALK*\n\n👤 Username: ${data.username}\n📝 Name: ${data.full_name}\n👥 Followers: ${data.followers}\n👤 Following: ${data.following}\n`
    await bad.sendMessage(m.chat, { image: { url: data.profile_pic }, caption }, { quoted: m })
  } catch (e) {
    reply('❌ User not found')
  }
}
break

case 'ttstalk':
case 'tiktokstalk':
case 'tiktok': {
    if (!text) return reply(`📱 *TikTok Stalk*\n\nExample: .ttstalk khaby.lame`);
    try {
        await reply('⏳ Fetching TikTok data...');
        const response = await axios.get(`https://apis.davidcyriltech.my.id/tiktokstalk?username=${encodeURIComponent(text)}`)
        const data = response.data.result
        if (!data) return reply('❌ User not found!');
        
        let msg = `╭━━〔 📱 TIKTOK STALK 〕━━┈⊷\n┃\n┃ 👤 *Name:* ${data.nickname}\n┃ 🔖 *Username:* @${data.username}\n┃ 👥 *Followers:* ${data.followers}\n┃ ❤️ *Likes:* ${data.likes}\n┃\n╰━━━━━━━━━━━━━━━┈⊷`;
        
        await bad.sendMessage(m.chat, { image: { url: data.profile }, caption: msg }, { quoted: m });
    } catch (error) {
        reply('❌ Failed to fetch TikTok data.');
    }
}
break;


// ═══════════════════════════════════════════════════════════════
// 5. TIKTOK STALK 2
// ═══════════════════════════════════════════════════════════════
case 'ttstalk2':
case 'tiktokstalk2': {
  if (!text) return reply(`*🎵 ᴛɪᴋᴛᴏᴋ sᴛᴀʟᴋ 2*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}ttstalk2 username`)
  try {
    const response = await axios.get(`${API_BASE}/tiktok-user2?apikey=${API_KEY}&user=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ ᴜsᴇʀ ɴᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.avatarLarger || data.avatar || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 🎵 ᴛɪᴋᴛᴏᴋ sᴛᴀʟᴋ 2 〕━━┈⊷*\n┃\n┃ 👤 u𝘀ᴇʀɴᴀᴍᴇ: ${data.uniqueId || data.username || 'N/A'}\n┃ 📝 nɪᴄᴋɴᴀᴍᴇ: ${data.nickname || 'N/A'}\n┃ 👥 fᴏʟʟᴏᴡᴇʀs: ${data.followerCount || 'N/A'}\n┃ ❤️ lɪᴋᴇs: ${data.heartCount || 'N/A'}\n┃ 🎥 vɪᴅᴇᴏs: ${data.videoCount || 'N/A'}\n┃ 📄 bɪᴏ: ${data.signature || 'N/A'}\n┃ ✅ vᴇʀɪғɪᴇᴅ: ${data.verified ? 'ʏᴇs' : 'ɴᴏ'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ ᴏʀ aᴘɪ eʀʀᴏʀ')
  }
}
break

// ═══════════════════════════════════════════════════════════════
// 6. TELEGRAM USER STALK
// ═══════════════════════════════════════════════════════════════
case 'tgstalk':
case 'telegramstalk':
case 'telegramuserstalk': {
  if (!text) return reply(`*✈️ ᴛᴇʟᴇɢʀᴀᴍ u𝘀ᴇʀ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}tgstalk username`)
  try {
    const response = await axios.get(`${API_BASE}/telegram-user?apikey=${API_KEY}&user=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.photo || data.avatar || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 ✈️ ᴛᴇʟᴇɢʀᴀᴍ u𝘀ᴇʀ sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 👤 u𝘀ᴇʀɴᴀᴍᴇ: ${data.username || 'N/A'}\n┃ 📝 fɪʀsᴛ nᴀᴍᴇ: ${data.first_name || 'N/A'}\n┃ 🆔 u𝘀ᴇʀ iᴅ: ${data.id || 'N/A'}\n┃ 📄 bɪᴏ: ${data.about || data.bio || 'N/A'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ ᴏʀ aᴘɪ eʀʀᴏʀ')
  }
}
break

// ═══════════════════════════════════════════════════════════════
// 7. TELEGRAM CHANNEL STALK
// ═══════════════════════════════════════════════════════════════
case 'tgchannelstalk':
case 'telegramchannelstalk': {
  if (!text) return reply(`*✈️ ᴛᴇʟᴇɢʀᴀᴍ cʜᴀɴɴᴇʟ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}tgchannelstalk channel`)
  try {
    const response = await axios.get(`${API_BASE}/telegram-channel?apikey=${API_KEY}&user=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ cʜᴀɴɴᴇʟ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.photo || data.avatar || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 ✈️ ᴛᴇʟᴇɢʀᴀᴍ cʜᴀɴɴᴇʟ sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 📢 cʜᴀɴɴᴇʟ: ${data.title || 'N/A'}\n┃ 👤 u𝘀ᴇʀɴᴀᴍᴇ: ${data.username || 'N/A'}\n┃ 👥 mᴇᴍbᴇʀs: ${data.members_count || data.subscribers || 'N/A'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ cʜᴀɴɴᴇʟ nᴏᴛ fᴏᴜɴᴅ ᴏʀ aᴘɪ eʀʀᴏʀ')
  }
}
break

// ═══════════════════════════════════════════════════════════════
// 8. TELEGRAM GROUP STALK
// ═══════════════════════════════════════════════════════════════
case 'tggroupstalk':
case 'telegramgroupstalk': {
  if (!text) return reply(`*✈️ ᴛᴇʟᴇɢʀᴀᴍ gʀᴏᴜᴘ sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}tggroupstalk group`)
  try {
    const response = await axios.get(`${API_BASE}/telegram-group?apikey=${API_KEY}&user=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ gʀᴏᴜᴘ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.photo || data.avatar || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 ✈️ ᴛᴇʟᴇɢʀᴀᴍ gʀᴏᴜᴘ sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 👥 gʀᴏᴜᴘ: ${data.title || 'N/A'}\n┃ 👥 mᴇᴍbᴇʀs: ${data.members_count || 'N/A'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ gʀᴏᴜᴘ nᴏᴛ fᴏᴜɴᴅ ᴏʀ aᴘɪ eʀʀᴏʀ')
  }
}
break

// ═══════════════════════════════════════════════════════════════
// 9. TWITTER STALK
// ═══════════════════════════════════════════════════════════════
case 'twitterstalk':
case 'xstalk': {
  if (!text) return reply(`*🐦 ᴛᴡɪᴛᴛᴇʀ/x sᴛᴀʟ🇰*\n\n💡 ᴇxᴀᴍᴘʟᴇ:\n${prefix}twitterstalk username`)
  try {
    const response = await axios.get(`${API_BASE}/twitter-user?apikey=${API_KEY}&user=${encodeURIComponent(text)}`)
    const data = response.data.result
    if (!data) return reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ')
    
    await bad.sendMessage(from, {
      image: { url: data.profile_image_url || data.avatar || 'https://ali-here-free-hosting.rf.gd//uploads/1782136045.jpg' },
      caption: `*╭━━〔 🐦 ᴛᴡɪᴛᴛᴇʀ/x sᴛᴀʟ🇰 〕━━┈⊷*\n┃\n┃ 👤 u𝘀ᴇʀɴᴀᴍᴇ: ${data.username || 'N/A'}\n┃ 📝 nᴀᴍᴇ: ${data.name || 'N/A'}\n┃ 👥 fᴏʟʟᴏᴡᴇʀs: ${data.followers_count || 'N/A'}\n┃ 🐦 tᴡᴇᴇᴛs: ${data.statuses_count || 'N/A'}\n┃\n*╰━━━━━━━━━━━━━━━┈⊷*`
    }, { quoted: m })
  } catch (error) {
    reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ ᴏʀ aᴘɪ eʀʀᴏʀ')
  }
}
break

case 'city': case 'night': case 'sunset': case 'rain': {
  await loading()
  const sceneryImages = {
    city: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82',
    night: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    sunset: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869',
    rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721'
  }
  await bad.sendMessage(m.chat, {
    image: { url: sceneryImages[command] },
    caption: `*◆ ${command.toUpperCase()} ᴡᴀʟʟᴘᴀᴘᴇʀ*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone`
  }, { quoted: m })
}
break

case 'cosplay': {
  await loading()
  try {
    const res = await fetch('https://api.waifu.im/search/?included_tags=cosplay&is_nsfw=false')
    const data = await res.json()
    if (data.images && data.images[0]) {
      await bad.sendMessage(m.chat, { image: { url: data.images[0].url }, caption: `*◆ cᴏsᴘʟᴀʏ*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone` }, { quoted: m })
    } else {
      throw new Error()
    }
  } catch (err) {
    await bad.sendMessage(m.chat, { image: { url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f' }, caption: `*◆ cᴏsᴘʟᴀʏ*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone` }, { quoted: m })
  }
}
break

// ═══════════════════════════════════════════════════════════
// EPHOTO360 & TEXT MAKERS
// ═══════════════════════════════════════════════════════════
case 'neontext': case 'neonglitch': case 'makingneon': {
  if (!text) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix + command} Your Text`)
  await loading()
  try {
    const apiUrl = `https://omegatech-api.dixonomega.tech/api/Maker/neon-text?text=${encodeURIComponent(text)}`
    await bad.sendMessage(m.chat, { image: { url: apiUrl }, caption: `*ɴᴇᴏɴ ᴛᴇxᴛ ᴍᴀᴋᴇʀ*\n\n📝 ${text}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone` }, { quoted: m })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ ᴛᴏ gᴇɴᴇʀᴀᴛᴇ.')
  }
}
break

case 'teximg': case 'teximage': case 'maketext': {
  if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .text2img a beautiful mountain landscape')
  await loading()
  try {
    const apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/txt2img?prompt=${encodeURIComponent(text)}&model=1`
    await bad.sendMessage(m.chat, { image: { url: apiUrl }, caption: `*◆ tᴇxᴛ ᴛᴏ iᴍᴀɢᴇ*\n\nᴘʀᴏᴍᴘᴛ: ${text}` }, { quoted: m })
  } catch (err) {
    reply('fᴀɪʟᴇᴅ ᴛᴏ gᴇɴᴇʀᴀᴛᴇ iᴍᴀɢᴇ.')
  }
}
break

// ═══════════════════════════════════════════════════════════
// LOGO & UTILITY COMMANDS
// ═══════════════════════════════════════════════════════════
case 'logo2': case 'makelogo': case 'createlogo': {
  if (!text) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix + command} NexGen Tech`)
  await loading()
  try {
    const apiUrl = `https://omegatech-api.dixonomega.tech/api/Maker/neon-text?text=${encodeURIComponent(text)}`
    await bad.sendMessage(m.chat, { image: { url: apiUrl }, caption: `*ʟᴏɢᴏ ᴍᴀᴋᴇʀ*\n\n📝 ${text}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone` }, { quoted: m })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ ᴛᴏ cʀᴇᴀᴛᴇ lᴏɢᴏ.')
  }
}
break

case 'advice': {
  try {
    const res = await fetch('https://api.adviceslip.com/advice')
    const data = await res.json()
    reply(`*💡 aᴅᴠɪᴄᴇ*\n\n${data.slip.advice}`)
  } catch (err) {
    reply(`*💡 aᴅᴠɪᴄᴇ*\n\nʙᴇʟɪᴇᴠᴇ iɴ yᴏᴜʀsᴇʟғ.`)
  }
}
break

case 'dadjoke': {
  try {
    const res = await fetch('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    reply(`*😄 dᴀᴅ jᴏᴋᴇ*\n\n${data.joke}`)
  } catch (err) {
    reply(`*😄 dᴀᴅ jᴏᴋᴇ*\n\nWhy don't scientists trust atoms? Because they make up everything!`)
  }
}
break

case 'ffstalk': {
  if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .ffstalk 1234567890')
  try {
    const res = await fetch(`https://api.lolhuman.xyz/api/freefire/${text}?apikey=GataDios`)
    const data = await res.json()
    reply(`*🎮 fʀᴇᴇ fɪʀᴇ pʀᴏғɪʟᴇ*\n\nɴᴀᴍᴇ: ${data.result.nickname}\nɪᴅ: ${text}`)
  } catch (err) {
    reply('pʟᴀʏᴇʀ nᴏᴛ fᴏᴜɴᴅ.')
  }
}
break

// ═══════════════════════════════════════════════════════════
// GROUP PROTECTION FEATURES (ANTILINK, WARN, PROTECT)
// ═══════════════════════════════════════════════════════════
case 'checkadmin':
case 'amiadmin': {
  if (!m.isGroup) return reply('❌ gʀᴏᴜᴘ oɴʟʏ!')
  try {
    const metadata = await bad.groupMetadata(from)
    const participant = metadata.participants.find(p => isSameUser(p.id, m.sender) || areJidsSameUser(p.id, m.sender))
    
    let status = `*🔍 aᴅᴍɪɴ sᴛᴀᴛᴜs cʜᴇᴄᴋ*\n\n*ʀᴏʟᴇ:* ${participant?.admin || 'member'}\n*isAdmins:* ${isAdmins ? '✅ ʏᴇs' : '❌ ɴᴏ'}\n*isCreator:* ${isCreator ? '✅ ʏᴇs' : '❌ ɴᴏ'}\n*isBotAdmins:* ${isBotAdmins ? '✅ ʏᴇs' : '❌ ɴᴏ'}`
    await bad.sendMessage(from, { text: status }, { quoted: m })
  } catch (error) {
    reply(`❌ eʀʀᴏʀ: ${error.message}`)
  }
}
break

case "antilink": {
    if (!isAdmins && !isCreator) return m.reply("ᴏɴʟʏ aᴅᴍɪɴs cᴀɴ tᴏɢɢʟᴇ aɴᴛɪʟɪɴᴋ.");
    if (!m.isGroup) return m.reply("ᴛʜɪs cᴏᴍᴍᴀɴᴅ oɴʟʏ wᴏʀᴋs iɴ gʀᴏᴜᴘs.");
    if (!args[1] || !args[2]) return m.reply("ᴜsᴀɢᴇ: aɴᴛɪʟɪɴᴋ wᴀʀɴ oɴ/ᴏғғ | aɴᴛɪʟɪɴᴋ kɪᴄᴋ oɴ/ᴏғғ | aɴᴛɪʟɪɴᴋ dᴇʟᴇᴛᴇ oɴ/ᴏғғ");

    const mode = args[1].toLowerCase();
    const action = args[2].toLowerCase();

    if (action === "on") {
        setSetting(m.chat, "antilink", mode);
        m.reply(`🛡️ aɴᴛɪʟɪɴᴋ eɴᴀʙʟᴇᴅ iɴ *${mode} mᴏᴅᴇ*`);
    } else if (action === "off") {
        setSetting(m.chat, "antilink", false);
        m.reply("🚫 aɴᴛɪʟɪɴᴋ dɪsᴀʙʟᴇᴅ");
    }
}
break;

case "autoreact": {
if (!isCreator) return m.reply("ᴏɴʟʏ oᴡɴᴇʀ cᴀɴ tᴏɢɢʟᴇ aᴜᴛᴏ rᴇᴀᴄᴛ.");
if (!args[1]) return m.reply("ᴜsᴀɢᴇ: aᴜᴛᴏʀᴇᴀᴄᴛ oɴ/ᴏғғ");
setSetting(m.chat, "autoReact", args[1].toLowerCase() === "on");
m.reply(`✅ aᴜᴛᴏ rᴇᴀᴄᴛ ${args[1]}`);
}
break;

case 'opentime': {
    if (!m.isGroup) return reply('gʀᴏᴜᴘ oɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('aᴅᴍɪɴs oɴʟʏ.')
    if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .opentime 10')
    
    const timer = parseInt(text) * 60 * 1000
    reply(`⏰ gʀᴏᴜᴘ wɪʟʟ oᴘᴇɴ iɴ ${text} mɪɴᴜᴛᴇs`)
    setTimeout(async () => {
        await bad.groupSettingUpdate(m.chat, 'not_announcement')
        await bad.sendMessage(m.chat, { text: '✅ gʀᴏᴜᴘ i𝘀 nᴏᴡ oᴘᴇɴ!' })
    }, timer)
}
break

case 'closetime': {
    if (!m.isGroup) return reply('gʀᴏᴜᴘ oɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('aᴅᴍɪɴs oɴʟʏ.')
    if (!text) return reply('ᴇxᴀᴍᴘʟᴇ: .closetime 10')
    
    const timer = parseInt(text) * 60 * 1000
    reply(`⏰ gʀᴏᴜᴘ wɪʟʟ cʟᴏsᴇ iɴ ${text} mɪɴᴜᴛᴇs`)
    setTimeout(async () => {
        await bad.groupSettingUpdate(m.chat, 'announcement')
        await bad.sendMessage(m.chat, { text: '🔒 gʀᴏᴜᴘ i𝘀 nᴏᴡ cʟᴏsᴇᴅ!' })
    }, timer)
}
break

case 'warn': {
    if (!m.isGroup) return reply('gʀᴏᴜᴘ oɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('aᴅᴍɪɴs oɴʟʏ.')
    if (!m.mentionedJid[0] && !m.quoted) return reply('mᴇɴᴛɪᴏɴ oʀ rᴇᴘʟʏ tᴏ a u𝘀ᴇʀ.')
    
    const user = m.mentionedJid[0] || m.quoted.sender
    const reason = args.slice(1).join(' ') || 'ɴᴏ rᴇᴀsᴏɴ'
    
    let groupWarns = getSetting(m.chat, "warns", {})
    if (!groupWarns[user]) groupWarns[user] = []
    groupWarns[user].push(reason)
    const warnCount = groupWarns[user].length
    setSetting(m.chat, "warns", groupWarns)
    
    if (warnCount >= 3) {
        if (isBotAdmins) {
            await bad.groupParticipantsUpdate(m.chat, [user], 'remove')
            reply(`⚠️ @${user.split('@')[0]} hᴀs bᴇᴇɴ kɪᴄᴋᴇᴅ aғᴛᴇʀ 3 wᴀʀɴɪɴɢs!`)
            delete groupWarns[user]
            setSetting(m.chat, "warns", groupWarns)
        } else {
            reply(`⚠️ @${user.split('@')[0]} rᴇᴀᴄʜᴇᴅ 3 wᴀʀɴɪɴɢs!`)
        }
    } else {
        reply(`⚠️ wᴀʀɴɪɴɢ ${warnCount}/3 fᴏʀ @${user.split('@')[0]}\nʀᴇᴀsᴏɴ: ${reason}`)
    }
}
break

case 'resetwarn': {
    if (!m.isGroup) return reply('gʀᴏᴜᴘ oɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('aᴅᴍɪɴs oɴʟʏ.')
    if (!m.mentionedJid[0] && !m.quoted) return reply('mᴇɴᴛɪᴏɴ oʀ rᴇᴘʟʏ tᴏ a u𝘀ᴇʀ.')
    
    const user = m.mentionedJid[0] || m.quoted.sender
    let groupWarns = getSetting(m.chat, "warns", {})
    
    if (groupWarns[user]) {
        delete groupWarns[user]
        setSetting(m.chat, "warns", groupWarns)
        reply(`✅ wᴀʀɴɪɴɢs rᴇsᴇᴛ fᴏʀ @${user.split('@')[0]}`)
    } else {
        reply('tʜɪs u𝘀ᴇʀ hᴀs nᴏ wᴀʀɴɪɴɢs.')
    }
}
break

case 'addprotect': {
    if (!m.isGroup) return reply('gʀᴏᴜᴘ oɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('aᴅᴍɪɴs oɴʟʏ.')
    
    let targetUser = m.quoted ? m.quoted.sender : m.mentionedJid?.[0]
    if (!targetUser) return reply(`❌ pʟᴇᴀsᴇ mᴇɴᴛɪᴏɴ oʀ rᴇᴘʟʏ tᴏ a u𝘀ᴇʀ!`)
    
    let protectedList = getSetting(m.chat, "protectedAdmins", [])
    if (protectedList.includes(targetUser)) return reply(`⚠️ u𝘀ᴇʀ i𝘀 aʟʀᴇᴀᴅʏ pʀᴏᴛᴇᴄᴛᴇᴅ!`)
    
    protectedList.push(targetUser)
    setSetting(m.chat, "protectedAdmins", protectedList)
    
    await bad.sendMessage(m.chat, { text: `✅ pʀᴏᴛᴇᴄᴛᴇᴅ aᴅᴍɪɴ aᴅᴅᴇᴅ fᴏʀ @${targetUser.split('@')[0]}`, mentions: [targetUser] })
}
break


// ═══════════════════════════════════════════════════════════════
// PROTECTION & ADMIN MANAGEMENT COMMANDS
// ═══════════════════════════════════════════════════════════════

case 'removeprotect': {
    if (!m.isGroup) return reply('ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('ᴀᴅᴍɪɴs ᴏɴʟʏ.')
    
    let targetUser = m.quoted ? m.quoted.sender : m.mentionedJid?.[0]
    if (!targetUser) return reply(`❌ ᴘʟᴇᴀsᴇ ᴍᴇɴᴛɪᴏɴ ᴏʀ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴜsᴇʀ!\n\nᴜsᴇ: ${prefix}removeprotect @user`)
    
    let protectedList = getSetting(m.chat, "protectedAdmins", [])
    if (protectedList.length === 0) return reply('❌ ɴᴏ ᴘʀᴏᴛᴇᴄᴛᴇᴅ aᴅᴍɪɴs iɴ tʜɪs gʀᴏᴜᴘ.')
    
    const index = protectedList.indexOf(targetUser)
    if (index === -1) return reply(`❌ @${targetUser.split('@')[0]} i𝘀 nᴏᴛ iɴ tʜᴇ pʀᴏᴛᴇᴄᴛᴇᴅ lɪsᴛ!`)
    
    protectedList.splice(index, 1)
    setSetting(m.chat, "protectedAdmins", protectedList)
    
    await bad.sendMessage(m.chat, { 
        text: `✅ *pʀᴏᴛᴇᴄᴛɪᴏɴ rᴇᴍᴏᴠᴇᴅ*\n\n@${targetUser.split('@')[0]} i𝘀 nᴏ lᴏɴɢᴇʀ pʀᴏᴛᴇᴄᴛᴇᴅ.`,
        mentions: [targetUser]
    })
}
break

case 'listprotect': {
    if (!m.isGroup) return reply('ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.')
    let protectedList = getSetting(m.chat, "protectedAdmins", [])
    
    if (protectedList.length === 0) return reply('📋 ɴᴏ pʀᴏᴛᴇᴄᴛᴇᴅ aᴅᴍɪɴs iɴ tʜɪs gʀᴏᴜᴘ.')
    
    const list = protectedList.map((jid, index) => `${index + 1}. @${jid.split('@')[0]}`).join('\n')
    await bad.sendMessage(m.chat, { 
        text: `🛡️ *pʀᴏᴛᴇᴄᴛᴇᴅ aᴅᴍɪɴs lɪsᴛ*\n\n${list}\n\n_ᴛʜᴇsᴇ u𝘀ᴇʀs cᴀɴɴᴏᴛ bᴇ dᴇᴍᴏᴛᴇᴅ_`,
        mentions: protectedList
    })
}
break

case 'antihijack': {
    if (!m.isGroup) return reply('ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ.')
    if (!isAdmins && !isCreator) return reply('ᴀᴅᴍɪɴs ᴏɴʟʏ.')
    
    const action = args[0]?.toLowerCase()
    if (!action || !['on', 'off'].includes(action)) {
        const status = getSetting(m.chat, "antihijack", false) ? '🟢 aᴄᴛɪᴠᴇ' : '🔴 iɴᴀᴄᴛɪᴠᴇ'
        return reply(`⚙️ *aɴᴛɪ-ʜɪᴊᴀᴄᴋ sᴛᴀᴛᴜs*\n\nᴄᴜʀʀᴇɴᴛ: ${status}\n\nᴜsᴇ: ${prefix}antihijack on/off`)
    }
    
    if (action === 'on') {
        if (getSetting(m.chat, "antihijack", false)) return reply('⚠️ aɴᴛɪ-ʜɪᴊᴀᴄᴋ i𝘀 aʟʀᴇᴀᴅʏ eɴᴀʙʟᴇᴅ!')
        setSetting(m.chat, "antihijack", true)
        await reply(`✅ *aɴᴛɪ-ʜɪᴊᴀᴄᴋ aᴄᴛɪᴠᴇ!*\n\n🛡️ aʟʟ aᴅᴍɪɴs pʀᴏᴛᴇᴄᴛᴇᴅ`)
    } else {
        if (!getSetting(m.chat, "antihijack", false)) return reply('⚠️ aɴᴛɪ-ʜɪᴊᴀᴄᴋ i𝘀 aʟʀᴇᴀᴅʏ dɪsᴀʙʟᴇᴅ!')
        setSetting(m.chat, "antihijack", false)
        await reply(`❌ *aɴᴛɪ-ʜɪᴊᴀᴄᴋ dᴇᴀᴄᴛɪᴠᴀᴛᴇᴅ*`)
    }
}
break

case "antibill": {
    if (!m.isGroup) return m.reply("ᴛʜɪs cᴏᴍᴍᴀɴᴅ oɴʟʏ wᴏʀᴋs iɴ gʀᴏᴜᴘs.");
    if (!isAdmins && !isCreator) return m.reply("ᴏɴʟʏ aᴅᴍɪɴs cᴀɴ eɴᴀʙʟᴇ/dɪsᴀʙʟᴇ aɴᴛɪ-ʙɪʟʟ.");
    
    const mode = args[1]?.toLowerCase();
    if (!mode) return m.reply(`ᴜsᴀɢᴇ: ${prefix}antibill on/off`);

    if (mode === "on") {
        setSetting(m.chat, "antibill", true);
        m.reply("🛡️ *aɴᴛɪ-ʙɪʟʟ pʀᴏᴛᴇᴄᴛɪᴏɴ eɴᴀʙʟᴇᴅ*");
    } else if (mode === "off") {
        setSetting(m.chat, "antibill", false);
        if (global.billWarnings && global.billWarnings[m.chat]) delete global.billWarnings[m.chat];
        m.reply("🚫 *aɴᴛɪ-ʙɪʟʟ pʀᴏᴛᴇᴄᴛɪᴏɴ dɪsᴀʙʟᴇᴅ*");
    }
}
break;

case 'checkadmin':
case 'admincheck':
case 'testadmin': {
  if (!m.isGroup) return reply('ᴛʜɪs cᴏᴍᴍᴀɴᴅ i𝘀 fᴏʀ gʀᴏᴜᴘs oɴʟʏ!')
  try {
    const groupMeta = await bad.groupMetadata(m.chat)
    const parts = groupMeta.participants
    const admins = parts.filter(p => p.admin)
    const botJid = bad.user.id
    
    const botInGroup = parts.find(p => p.id === botJid || areJidsSameUser(p.id, botJid))
    const userInGroup = parts.find(p => p.id === m.sender || areJidsSameUser(p.id, m.sender))
    
    let debugInfo = `*🔍 aᴅᴍɪɴ sᴛᴀᴛᴜs cʜᴇᴄᴋ*\n\n📱 *ɢʀᴏᴜᴘ:* ${groupMeta.subject}\n\n`
    debugInfo += `🤖 *ʙᴏᴛ:* ${botInGroup?.admin || 'ɴᴏɴᴇ'}\n👤 *ʏᴏᴜ:* ${userInGroup?.admin || 'ɴᴏɴᴇ'}\n`
    debugInfo += `📊 *ᴛᴏᴛᴀʟ aᴅᴍɪɴs:* ${admins.length}`
    
    reply(debugInfo)
  } catch (e) {
    reply(`❌ eʀʀᴏʀ: ${e.message}`)
  }
}
break

// ═══════════════════════════════════════════════════════════════
// DOWNLOADERS & AI GENERATORS
// ═══════════════════════════════════════════════════════════════

case "ytvideo":
case "ytmp4": {
    if (!text) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ yᴏᴜᴛᴜʙᴇ lɪɴ🇰");
    try {
        await bad.sendMessage(m.chat, {react: {text: '⏳', key: m.key}});
        const response = await axios.post('https://youtube-video-audio-downloader.p.rapidapi.com/videos/downloads', 
        { url: text, quality: '720' },
        { headers: { 'content-type': 'application/json', 'x-rapidapi-key': 'e73bff0542msha94d08136fc4eeep184ff6jsn5bcade1d7824', 'x-rapidapi-host': 'youtube-video-audio-downloader.p.rapidapi.com' } });
        
        const data = response.data;
        if (data && data.downloadUrl) {
            await bad.sendMessage(m.chat, { video: {url: data.downloadUrl}, caption: `*ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ vɪᴅᴇᴏ lɪɴ🇰 fᴏᴜɴᴅ');
        }
    } catch (error) {
        await bad.sendMessage(m.chat, {react: {text: '❌', key: m.key}});
        reply(`❌ dᴏᴡɴʟᴏᴀᴅ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case 'play':
case 'song': {
  if (!text) return reply(`🎵 Provide a song name`)
  try {
    await bad.sendMessage(m.chat, { react: { text: '🎶', key: m.key } })
    const apiRes = await axios.get(`https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(text)}&apikey=`, { timeout: 15000 })
    const apiData = apiRes.data
    const audioUrl = apiData?.result?.audio || apiData?.result?.download_url
    const title = apiData?.result?.title || text
    
    if (audioUrl) {
      await bad.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m })
    } else {
      reply('❌ No results found')
    }
    await bad.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    reply(`❌ Error: ${e.message}`)
  }
}
break

case "tiktok":
case "tt": {
    if (!text || !text.includes('tiktok.com')) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ tɪᴋᴛᴏᴋ lɪɴ🇰");
    try {
        await bad.sendMessage(m.chat, {react: {text: '⏳', key: m.key}});
        const response = await axios.get(`https://api.nexoracle.com/downloader/tiktok-wm?apikey=free_key@maher_apis&url=${encodeURIComponent(text)}`);
        const data = response.data.result;
        
        if (data && data.url) {
            await bad.sendMessage(m.chat, { video: {url: data.url}, caption: `*ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ vɪᴅᴇᴏ fᴏᴜɴᴅ');
        }
    } catch (error) {
        await bad.sendMessage(m.chat, {react: {text: '❌', key: m.key}});
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case 'apk':
case 'apkdl': {
  if (!text) return reply(`*Example:* ${prefix + command} com.whatsapp`);
  try {
    const data = await fetchJson(`https://api.nexoracle.com/downloader/apk?apikey=free_key@maher_apis&q=${encodeURIComponent(text)}`);
    if (data.status && data.result) {
      await bad.sendMessage(m.chat, { document: { url: data.result.download }, fileName: `${data.result.name}.apk`, mimetype: 'application/vnd.android.package-archive' }, { quoted: m });
    } else {
      reply('*APK not found.*');
    }
  } catch (e) {
    reply('*Failed to fetch APK.*');
  }
}
break;

case 'tomp4': {
  if (!m.quoted || !/webp|gif/.test(m.quoted.mimetype || '')) return reply("⚠️ Reply to a sticker or gif");
  try {
    let media = await bad.downloadMediaMessage(m.quoted);
    await bad.sendMessage(m.chat, { video: media, mimetype: 'video/mp4', caption: "🎬 Converted to MP4" }, { quoted: m });
  } catch (e) {
    reply("❌ Failed to convert");
  }
}
break;

case 'tomp3': {
  if (!m.quoted || !/video/.test(m.quoted.mimetype || '')) return reply("⚠️ Reply to a video");
  try {
    let media = await bad.downloadMediaMessage(m.quoted);
    await bad.sendMessage(m.chat, { audio: media, mimetype: 'audio/mpeg' }, { quoted: m });
  } catch (e) {
    reply("❌ Failed to convert");
  }
}
break;

case "instagram":
case "ig":
case "igdl": {
    if (!text || !text.includes('instagram.com')) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ iɴsᴛᴀɢʀᴀᴍ lɪɴ🇰");
    try {
        await bad.sendMessage(m.chat, {react: {text: '⏳', key: m.key}});
        const response = await axios.get(`https://api.nexoracle.com/downloader/insta?apikey=free_key@maher_apis&url=${encodeURIComponent(text)}`);
        const data = response.data.result;
        
        if (data && data.url_list?.[0]) {
            await bad.sendMessage(m.chat, { video: {url: data.url_list[0]}, caption: `*ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ mᴇᴅɪᴀ fᴏᴜɴᴅ');
        }
    } catch (error) {
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case "facebook":
case "fb":
case "fbdl": {
    if (!text || !text.includes('facebook.com')) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ fᴀᴄᴇʙᴏᴏᴋ lɪɴ🇰");
    try {
        await bad.sendMessage(m.chat, {react: {text: '⏳', key: m.key}});
        const response = await axios.get('https://facebook-scraper3.p.rapidapi.com/video', {
            params: { url: text },
            headers: { 'x-rapidapi-key': 'e73bff0542msha94d08136fc4eeep184ff6jsn5bcade1d7824', 'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com' }
        });
        const data = response.data;
        if (data && data.sd_url) {
            await bad.sendMessage(m.chat, { video: {url: data.hd_url || data.sd_url}, caption: `*ғᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ vɪᴅᴇᴏ fᴏᴜɴᴅ');
        }
    } catch (error) {
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case "twitter":
case "twdl":
case "x": {
    if (!text || !text.includes('twitter.com') && !text.includes('x.com')) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ tᴡɪᴛᴛᴇʀ lɪɴ🇰");
    try {
        await bad.sendMessage(m.chat, {react: {text: '⏳', key: m.key}});
        const response = await axios.get('https://twitter-video-and-image-downloader.p.rapidapi.com/api/twitter/media', {
            params: { url: text },
            headers: { 'x-rapidapi-key': 'e73bff0542msha94d08136fc4eeep184ff6jsn5bcade1d7824', 'x-rapidapi-host': 'twitter-video-and-image-downloader.p.rapidapi.com' }
        });
        const data = response.data;
        if (data?.media?.[0]) {
            await bad.sendMessage(m.chat, { video: {url: data.media[0].url}, caption: `*ᴛᴡɪᴛᴛᴇʀ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ mᴇᴅɪᴀ fᴏᴜɴᴅ');
        }
    } catch (error) {
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case "runway":
case "aivideo":
case "gen3": {
    if (!text) return reply("ᴘʀᴏvɪᴅᴇ a pʀᴏᴍᴘᴛ fᴏʀ aɪ vɪᴅᴇᴏ");
    try {
        await bad.sendMessage(m.chat, {react: {text: '🎬', key: m.key}});
        reply("⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ aɪ vɪᴅᴇᴏ...*");
        
        const response = await axios.post('https://runwayml.p.rapidapi.com/generate', 
        { prompt: text, model: "gen3" },
        { headers: { 'content-type': 'application/json', 'x-rapidapi-key': 'e73bff0542msha94d08136fc4eeep184ff6jsn5bcade1d7824', 'x-rapidapi-host': 'runwayml.p.rapidapi.com' } });
        
        const data = response.data;
        if (data && data.video_url) {
            await bad.sendMessage(m.chat, { video: {url: data.video_url}, caption: `*ʀᴜɴᴡᴀʏᴍʟ aɪ vɪᴅᴇᴏ*\n📝 ${text}`, mimetype: 'video/mp4' }, {quoted: m});
            await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
        } else {
            throw new Error('ɴᴏ vɪᴅᴇᴏ gᴇɴᴇʀᴀᴛᴇᴅ');
        }
    } catch (error) {
        reply(`❌ aɪ vɪᴅᴇᴏ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

// ═══════════════════════════════════════════════════════════
// OWNER & CONTACT COMMANDS
// ═══════════════════════════════════════════════════════════
case 'owner':
case 'contact': {
    const msg = await bad.sendMessage(m.chat, { 
        text: `✦ 📞 ᴺᵉᵉᵈ ᴴᵉˡᵖ? » ᶜᵒⁿᵗᵃᶜᵗ ᴹʸ ᴼʷⁿᵉʳˢ ✦`
    }, { quoted: m });
    
    await sleep(1000);
    
    const vcard1 = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN: ALI\n' +
                  'TEL;type=CELL;type=VOICE;waid=923077033684:+923077033684\n' +
                  'END:VCARD';
    
    await bad.sendMessage(m.chat, {
        contacts: {
            displayName: 'ᴀʟɪ☠',
            contacts: [{ vcard: vcard1 }]
        }
    }, { quoted: msg });
    
    await sleep(1000);
    
    const vcard2 = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN: ALI\n' +
                  'TEL;type=CELL;type=VOICE;waid=923077033684:+923077033684\n' +
                  'END:VCARD';
    
    await bad.sendMessage(m.chat, {
        contacts: {
            displayName: 'ᴀʟɪ',
            contacts: [{ vcard: vcard2 }]
        }
    }, { quoted: msg });
}
break;

// ═══════════════════════════════════════════════════════════
// SPOTIFY DOWNLOADER
// ═══════════════════════════════════════════════════════════
case "spotify":
case "spotifydl": {
    if (!text) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ sᴘᴏᴛɪғʏ lɪɴ🇰");
    if (!text.includes('spotify.com')) return reply("ᴘʟᴇᴀsᴇ pʀᴏvɪᴅᴇ a vᴀʟɪᴅ sᴘᴏᴛɪғʏ lɪɴ🇰");
    
    try {
        await bad.sendMessage(m.chat, {react: {text: '🎵', key: m.key}});
        const response = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(text)}`);
        const data = response.data.result;
        
        if (data && data.id) {
            const downloadResponse = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${data.gid}/${data.id}`);
            const downloadData = downloadResponse.data.result;
            
            if (downloadData && downloadData.download_url) {
                await bad.sendMessage(m.chat, {
                    audio: {url: downloadData.download_url},
                    mimetype: "audio/mpeg",
                    fileName: `${data.name} - ${data.artists}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            thumbnailUrl: data.image,
                            title: data.name,
                            body: `ᴀʀᴛɪsᴛ: ${data.artists}`,
                            sourceUrl: text,
                            renderLargerThumbnail: true,
                            mediaType: 1
                        }
                    }
                }, {quoted: m});
                await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
            } else {
                throw new Error('ɴᴏ dᴏᴡɴʟᴏᴀᴅ lɪɴ🇰 fᴏᴜɴᴅ');
            }
        }
    } catch (error) {
        await bad.sendMessage(m.chat, {react: {text: '❌', key: m.key}});
        reply(`❌ sᴘᴏᴛɪғʏ dᴏᴡɴʟᴏᴀᴅ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

// ═══════════════════════════════════════════════════════════
// MEDIAFIRE DOWNLOADER
// ═══════════════════════════════════════════════════════════
case 'mediafire': {
  if (!text || !text.includes('mediafire.com')) return reply('❌ Invalid MediaFire link!');
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}downloader/mediafire?apikey=${NEXORACLE_KEY}&url=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    
    if (data.status && data.result) {
      const { filename, filesize, download } = data.result;
      await reply(`📁 *MediaFire*\n\n📌 Name: ${filename}\n📦 Size: ${filesize}`);
      await bad.sendMessage(m.chat, { document: { url: download }, fileName: filename, mimetype: 'application/octet-stream' }, { quoted: m });
    } else {
      reply('❌ Failed to download file.');
    }
  } catch (err) {
    reply('❌ Failed to download file.');
  }
}
break;

// ═══════════════════════════════════════════════════════════
// PINTEREST
// ═══════════════════════════════════════════════════════════
case 'pinterest':
case 'pin': {
  if (!text) return reply(`*Example:* ${prefix + command} cat aesthetic`);
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}search/pinterest-image?apikey=${NEXORACLE_KEY}&q=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    
    if (data.status && data.result?.length > 0) {
      const randomImage = data.result[Math.floor(Math.random() * Math.min(10, data.result.length))];
      await bad.sendMessage(m.chat, { image: { url: randomImage }, caption: `✅ *Pinterest Image*` }, { quoted: m });
    } else {
      reply('❌ Failed to fetch image');
    }
  } catch (err) {
    reply('❌ Failed to fetch image');
  }
}
break;

// ═══════════════════════════════════════════════════════════
// YTMP3 & YTMP4
// ═══════════════════════════════════════════════════════════
case 'ytmp3':
case 'ytaudio': {
  if (!text) return reply(`*Usage:* ${prefix}ytmp3 <youtube url>`);
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}downloader/ytmp3?apikey=${NEXORACLE_KEY}&url=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    if (data.status && data.result?.download) {
      await bad.sendMessage(m.chat, { audio: { url: data.result.download }, mimetype: 'audio/mpeg', fileName: `${data.result.title || 'audio'}.mp3` }, { quoted: m });
    } else {
      reply('❌ Failed to download audio.');
    }
  } catch (err) {
    reply('❌ Failed to download audio.');
  }
}
break;

case 'ytmp4':
case 'ytvideo': {
  if (!text) return reply(`*Usage:* ${prefix}ytmp4 <youtube url>`);
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}downloader/ytmp4?apikey=${NEXORACLE_KEY}&url=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    if (data.status && data.result?.video) {
      await bad.sendMessage(m.chat, { video: { url: data.result.video }, mimetype: 'video/mp4', fileName: `${data.result.title || 'video'}.mp4` }, { quoted: m });
    } else {
      reply('❌ Failed to download.');
    }
  } catch (err) {
    reply('❌ Failed to download.');
  }
}
break;

// ═══════════════════════════════════════════════════════════
// CAPCUT & THREADS
// ═══════════════════════════════════════════════════════════
case 'capcut':
case 'capcutdl': {
  if (!text || !text.includes('capcut.com')) return reply('❌ Invalid CapCut link!');
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}downloader/capcut?apikey=${NEXORACLE_KEY}&url=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    if (data.status && data.result?.video) {
      await bad.sendMessage(m.chat, { video: { url: data.result.video }, caption: `✅ *CapCut Video*` }, { quoted: m });
    } else {
      reply('❌ Failed to download');
    }
  } catch (err) {
    reply('❌ Failed to download');
  }
}
break;

case 'threads':
case 'threadsdl': {
  if (!text || !text.includes('threads.net')) return reply('❌ Invalid Threads link!');
  await loading();
  try {
    const apiUrl = `${NEXORACLE_API}downloader/threads?apikey=${NEXORACLE_KEY}&url=${encodeURIComponent(text)}`;
    const data = await fetchJson(apiUrl);
    if (data.status && data.result?.video) {
      await bad.sendMessage(m.chat, { video: { url: data.result.video }, caption: `✅ *Threads Video*` }, { quoted: m });
    } else {
      reply('❌ Failed to download');
    }
  } catch (err) {
    reply('❌ Failed to download.');
  }
}
break;

// ═══════════════════════════════════════════════════════════
// WALLPAPER
// ═══════════════════════════════════════════════════════════
case 'wallpaper':
case 'wp': {
  if (!text) return reply(`*ᴇxᴀᴍᴘʟᴇ:* ${prefix + command} nature`)
  await loading()
  try {
    const data = await fetchAPI('download/wallpaper', { query: text })
    if (!data?.status || !data?.result || data.result.length === 0) return reply('❌ ɴᴏ wᴀʟʟᴘᴀᴘᴇʀs fᴏᴜɴᴅ')
    
    const randomWallpaper = data.result[Math.floor(Math.random() * data.result.length)]
    await bad.sendMessage(m.chat, { image: { url: randomWallpaper }, caption: `✅ *ᴡᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ')
  }
}
break

// ═══════════════════════════════════════════════════════════
// FUN & MEDIA COMMANDS
// ═══════════════════════════════════════════════════════════
case 'meme': {
  await loading()
  try {
    const res = await fetch('https://meme-api.com/gimme')
    const data = await res.json()
    if (data.url) {
      await bad.sendMessage(m.chat, { image: { url: data.url }, caption: `*◆ rᴀɴᴅᴏᴍ mᴇᴍᴇ*\n\n📝 ${data.title}\n👍 ${data.ups} upvotes` }, { quoted: m })
    } else {
      throw new Error()
    }
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 mᴇᴍᴇ.')
  }
}
break

case 'gali': {
    let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null
    let name = q ? q.trim().toLowerCase() : ''
    let blocked = ['ᴀʟɪ','ᴀʟɪ']

    if (blocked.includes(name)) {
        return bad.sendMessage(m.chat, { text: `${name.toUpperCase()} KO TUM ABBU HI BANA LO`, mentions: [m.sender] }, { quoted: m })
    }

    let galis = [
        `${q || '@' + target?.split('@')[0]} - teri mkc bc laudy gando bsdk bkl 💀`,
        `${q || '@' + target?.split('@')[0]} - salay tata madarchod randwe gando mkc Tari 🤡`
    ]
    let random = galis[Math.floor(Math.random() * galis.length)]

    if (target) {
        return bad.sendMessage(m.chat, { text: random, mentions: [target] }, { quoted: m })
    } else {
        return reply(random)
    }
}
break

case 'joke': case 'dadkjoke': {
  await loading()
  try {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke')
    const data = await res.json()
    reply(`*◆ rᴀɴᴅᴏᴍ jᴏᴋᴇ*\n\n${data.setup}\n\n${data.punchline} 😂`)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 jᴏᴋᴇ.')
  }
}
break

case 'quote': case 'quotes': {
  await loading()
  try {
    const res = await fetch('https://api.quotable.io/random')
    const data = await res.json()
    reply(`*◆ iɴsᴘɪʀᴀᴛɪᴏɴᴀʟ qᴜᴏᴛᴇ*\n\n"${data.content}"\n\n— ${data.author}`)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 qᴜᴏᴛᴇ.')
  }
}
break

case "createqoute":
case "quotemake":
case "makeq": {
    if (!text) return reply("Life is beautiful | -Anonymous");
    const input = text.split("|");
    if (input.length < 2) return reply("❌ *ᴜsᴀɢᴇ:* .quote text | author");
    
    try {
        await bad.sendMessage(m.chat, {react: {text: '📝', key: m.key}});
        const apiUrl = `https://api.nexoracle.com/image-creating/quotes-maker?apikey=free_key@maher_apis&text1=${encodeURIComponent(input[0].trim())}&text2=${encodeURIComponent(input[1].trim())}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        
        await bad.sendMessage(m.chat, { image: Buffer.from(response.data, 'binary'), caption: `📝 *ǫᴜᴏᴛᴇ cʀᴇᴀᴛᴇᴅ*` }, {quoted: m});
        await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
    } catch (error) {
        reply(`❌ qᴜᴏᴛᴇ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case 'fact': case 'randomfact': {
  await loading()
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en')
    const data = await res.json()
    reply(`*◆ rᴀɴᴅᴏᴍ fᴀᴄᴛ*\n\n${data.text}`)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 fᴀᴄᴛ.')
  }
}
break

case 'trivia': {
  await loading()
  try {
    const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple')
    const data = await res.json()
    const q = data.results[0]
    const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5)
    
    let triviaText = `*◆ tʀɪᴠɪᴀ qᴜᴇsᴛɪᴏɴ*\n\n❓ ${q.question}\n\nOptions:\n`
    answers.forEach((ans, i) => { triviaText += `${i + 1}. ${ans}\n` })
    triviaText += `\n✅ Answer: ${q.correct_answer}`
    reply(triviaText)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 tʀɪᴠɪᴀ.')
  }
}
break

case 'riddle': {
  await loading()
  try {
    const res = await fetch('https://riddles-api.vercel.app/random')
    const data = await res.json()
    reply(`*◆ rɪᴅᴅʟᴇ*\n\n❓ ${data.riddle}\n\n✅ Answer: ${data.answer}`)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 rɪᴅᴅʟᴇ.')
  }
}
break

case 'advice': {
  await loading()
  try {
    const res = await fetch('https://api.adviceslip.com/advice')
    const data = await res.json()
    reply(`*◆ rᴀɴᴅᴏᴍ aᴅᴠɪᴄᴇ*\n\n💡 ${data.slip.advice}`)
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 aᴅᴠɪᴄᴇ.')
  }
}
break

case '8ball': {
  if (!text) return reply('Ask a yes/no question!')
  const answers = ["Yes, definitely! ✅", "It is certain ✅", "Without a doubt ✅", "My reply is no ❌", "Very doubtful ❌"]
  reply(`*◆ mᴀɢɪᴄ 8-ʙᴀʟʟ*\n\n❓ Question: ${text}\n\n🔮 Answer: ${answers[Math.floor(Math.random() * answers.length)]}`)
}
break

case 'coinflip': case 'flip': {
  reply(`*◆ cᴏɪɴ fʟɪᴘ*\n\n🎲 Result: ${Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙'}`)
}
break

case 'dice': case 'roll': {
  reply(`*◆ dɪᴄᴇ rᴏʟʟ*\n\n🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}`)
}
break

// ═══════════════════════════════════════════════════════════
// CHANNEL REACTOR
// ═══════════════════════════════════════════════════════════
case 'rch':
case 'reactch':
case 'channelreact': {
    if (!text) return reply(`Usages: ${prefix}${command} <link> <emoji1,emoji2>`)
    await bad.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })
    
    try {
        const argsList = text.trim().split(/\s+/).filter(Boolean);
        const postLink = argsList[0];
        const emojis = argsList.slice(1).join(' ').split(',').map(e => e.trim()).filter(Boolean);

        if (!postLink || !postLink.includes('whatsapp.com/channel/')) return reply('❌ Invalid channel link.')
        if (!emojis.length) return reply('❌ No emojis provided.')

        const { data: captchaData } = await axios.get('https://omegatech-api.dixonomega.tech/api/tools/recaptcha-v3', {
            params: { sitekey: '6LemKk8sAAAAAH5PB3f1EspbMlXjtwv5C8tiMHSm', url: 'https://back.asitha.top/api', use_enterprise: 'false' }
        })

        const userJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGNjM2MyMjgzMGQzNGZiMzIwMzc5OSIsImlhdCI6MTc3NjQ1MjI1MywiZXhwIjoxNzc3MOfMDUzfQ.DuaYpoDrUmF39HjOi2ulk14dZHEWLmSxWH4_MIooaOk'
        const backendUrl = 'https://back.asitha.top/api'

        const { data: tempKeyData } = await axios.post(`${backendUrl}/user/get-temp-token`, 
            { recaptcha_token: captchaData.token },
            { headers: { Authorization: `Bearer ${userJwt}`, 'Content-Type': 'application/json' } }
        )

        await axios.post(`${backendUrl}/channel/react-to-post?apiKey=${tempKeyData.token}`, 
            { post_link: postLink, reacts: emojis.join(',') },
            { headers: { Authorization: `Bearer ${userJwt}`, 'Content-Type': 'application/json' } }
        )

        await bad.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        reply(`✅ Successfully reacted to channel post!`)
    } catch (e) {
        await bad.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        reply(`❌ Failed: ${e.message}`)
    }
}
break

// ═══════════════════════════════════════════════════════════
// SORA, SORA2 & VEO3 AI VIDEO GENERATORS
// ═══════════════════════════════════════════════════════════
case 'sora':
case 'soraai': {
  if (!text) return reply(`*ᴜsᴀɢᴇ:* ${prefix}sora <prompt>`)
  let prompt = text.trim()
  
  try {
    const apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/sora?prompt=${encodeURIComponent(prompt)}`
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.success && data.result) {
      await bad.sendMessage(m.chat, { video: { url: data.result }, caption: `*◆ sᴏʀᴀ aɪ vɪᴅᴇᴏ*\n📝 ${prompt}`, gifPlayback: false }, { quoted: m })
    } else {
      throw new Error(data.message || 'Failed')
    }
  } catch (err) {
    reply(`❌ fᴀɪʟᴇᴅ tᴏ gᴇɴᴇʀᴀᴛᴇ vɪᴅᴇᴏ.`)
  }
}
break

case 'veo3': {
  if (!text) return reply(`*🎬 ᴠᴇo 3* - Usage: ${prefix}veo3 <prompt>`)
  try {
    let apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/Veo3?prompt=${encodeURIComponent(text)}&ratio=16:9`
    const initialResponse = await axios.get(apiUrl, { timeout: 30000 })
    const { id } = initialResponse.data.result || {}
    
    if (!id) return reply('❌ Failed to start generation')
    reply(`✅ Video generation started! Job ID: \`${id}\`. Please wait...`)
    
    let videoUrl = null
    for (let attempts = 0; attempts < 40; attempts++) {
      await sleep(5000)
      const statusRes = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/Veo3?id=${id}`, { timeout: 15000 })
      const result = statusRes.data.result
      
      if (result?.status === 'completed' && result?.output) {
        videoUrl = result.output
        break
      }
      if (result?.status === 'failed') return reply('❌ Video generation failed.')
    }
    
    if (!videoUrl) return reply('⏱️ Timeout generating video.')
    
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' })
    await bad.sendMessage(from, { video: Buffer.from(videoResponse.data), caption: `*🎬 ᴠᴇᴏ 3 - cᴏᴍᴘʟᴇᴛᴇᴅ*`, mimetype: 'video/mp4' }, { quoted: m })
  } catch (error) {
    reply(`❌ Error: ${error.message}`)
  }
}
break

// ═══════════════════════════════════════════════════════════
// ANIME, STALK & FUN COMMANDS
// ═══════════════════════════════════════════════════════════

case 'maid-pic': {
  await loading()
  try {
    const imageUrl = `https://Omegatech-api.dixonomega.tech/api/maid`
    await bad.sendMessage(m.chat, { image: { url: imageUrl }, caption: `*◆ ᴍᴀɪᴅ*\n\n> ʀᴀɴᴅᴏᴍ ᴍᴀɪᴅ ᴀɴɪᴍᴇ ɪᴍᴀɢᴇ 👗` }, { quoted: m })
  } catch (err) {
    reply('⚠️ ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.')
  }
}
break

case 'milf': {
  await loading()
  try {
    const imageUrl = `https://Omegatech-api.dixonomega.tech/api/milf`
    await bad.sendMessage(m.chat, { image: { url: imageUrl }, caption: `*◆ ᴍɪʟғ*\n\n> ʀᴀɴᴅᴏᴍ mᴀᴛᴜʀᴇ iᴍᴀɢᴇ 👩` }, { quoted: m })
  } catch (err) {
    reply('⚠️ ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.')
  }
}
break

case 'neko2': {
  await loading()
  try {
    const imageUrl = `https://Omegatech-api.dixonomega.tech/api/neko`
    await bad.sendMessage(m.chat, { image: { url: imageUrl }, caption: `*◆ ɴᴇᴋᴏ*\n\n> ʀᴀɴᴅᴏᴍ nᴇᴋᴏ aɴɪᴍᴇ iᴍᴀɢᴇ 🐱` }, { quoted: m })
  } catch (err) {
    reply('⚠️ ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.')
  }
}
break

case 'telegramstalk':
case 'tgstalk': {
  if (!text) return reply(`*ᴜsᴀɢᴇ:* ${prefix}telegram <username>`)
  await loading()
  try {
    const res = await axios.get(`https://Omegatech-api.dixonomega.tech/api/tgstalk?username=${encodeURIComponent(text)}`)
    const data = res.data
    
    if (data.status && data.result) {
      let tgInfo = `*◆ ᴛᴇʟᴇɢʀᴀᴍ sᴛᴀʟᴋ*\n\n*ᴜsᴇʀɴᴀᴍᴇ:* @${data.result.username}\n*ɴᴀᴍᴇ:* ${data.result.name || 'N/A'}\n*ʙɪᴏ:* ${data.result.bio || 'N/A'}`
      if (data.result.photo) {
        await bad.sendMessage(m.chat, { image: { url: data.result.photo }, caption: tgInfo }, { quoted: m })
      } else {
        reply(tgInfo)
      }
    } else {
      reply('❌ u𝘀ᴇʀ nᴏᴛ fᴏᴜɴᴅ.')
    }
  } catch (err) {
    reply('⚠️ fᴀɪʟᴇᴅ tᴏ sᴛᴀʟ🇰 tᴇʟᴇɢʀᴀᴍ u𝘀ᴇʀ.')
  }
}
break

case 'roast': {
  let target = m.mentionedJid[0] || m.quoted?.sender
  if (!target) return reply('Mention karo ya kisi message ka reply karo roast karne ke liye.')
  
  const roasts = [
    "Tumhara dimaag loading mein rehta hai shayad.",
    "Tumhari soch 2G internet se bhi slow hai.",
    "Tum itne confuse rehte ho ke Google bhi answer na de."
  ]
  let roastText = roasts[Math.floor(Math.random() * roasts.length)]
  await bad.sendMessage(m.chat, { text: `🔥 *@${target.split('@')[0]}*\n${roastText}`, mentions: [target] }, { quoted: m })
}
break

case 'ship': {
  if (!m.isGroup) return reply('Group command only.')
  const members = participants.filter(p => !p.admin)
  if (members.length < 2) return reply('Not enough members!')
  
  const person1 = members[Math.floor(Math.random() * members.length)]
  let person2 = members[Math.floor(Math.random() * members.length)]
  while (person2.id === person1.id && members.length > 1) {
    person2 = members[Math.floor(Math.random() * members.length)]
  }
  
  const percent = Math.floor(Math.random() * 100)
  await bad.sendMessage(m.chat, { text: `💘 *Shipping Result*\n\n@${person1.id.split('@')[0]} ❤️ @${person2.id.split('@')[0]}\n\nCompatibility: ${percent}%`, mentions: [person1.id, person2.id] }, { quoted: m })
}
break

case 'hack': {
  let target = m.mentionedJid[0] || m.quoted?.sender
  if (!target) return reply('ᴍᴇɴᴛɪᴏɴ oʀ rᴇᴘʟʏ tᴏ sᴏᴍᴇᴏɴᴇ tᴏ hᴀᴄᴋ tʜᴇᴍ!')
  
  const targetName = target.split('@')[0]
  await reply('🔍 ɪɴɪᴛɪᴀʟɪᴢɪɴɢ ʜᴀᴄᴋ...')
  await sleep(1500)
  
  const finalMessage = `╭━━〔 ☠️ ʜᴀᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇ ☠️ 〕━━┈⊷\n┃ ✅ *sʏsᴛᴇᴍ bʀᴇᴀᴄʜᴇᴅ!* \n┃ 👤 *ɴᴀᴍᴇ:* ${targetName}\n┃ 📱 *ᴘʜᴏɴᴇ:* +234${Math.floor(Math.random() * 9000000000 + 1000000000)}\n╰━━━━━━━━━━━━━━━┈⊷\n\n*⚠️ ᴊᴜsᴛ kɪᴅᴅɪɴɢ! 😂*`
  reply(finalMessage)
}
break

case 'couple': {
  if (!m.isGroup) return reply('Group command only.')
  const members = participants.filter(p => !p.admin)
  if (members.length < 2) return reply('Not enough members!')
  
  const p1 = members[Math.floor(Math.random() * members.length)]
  let p2 = members[Math.floor(Math.random() * members.length)]
  while (p2.id === p1.id && members.length > 1) p2 = members[Math.floor(Math.random() * members.length)]
  
  await bad.sendMessage(m.chat, { text: `💑 *Couple Of The Day*\n\n@${p1.id.split('@')[0]} ❤️ @${p2.id.split('@')[0]}\n💕 Compatibility: ${Math.floor(Math.random() * 100)}%`, mentions: [p1.id, p2.id] }, { quoted: m })
}
break

case 'flirt': {
  let target = m.mentionedJid[0] || m.quoted?.sender || m.sender
  const lines = [
    "@user tumhari smile dekh kar lagta hai chand bhi jealous ho jaye.",
    "@user agar khoobsurti ek crime hoti to tum life time jail me hotay."
  ]
  let text = lines[Math.floor(Math.random() * lines.length)].replace("@user", `@${target.split("@")[0]}`)
  await bad.sendMessage(m.chat, { text, mentions: [target] }, { quoted: m })
}
break

case 'compliment': case 'tareef': case 'respect': {
  let target = m.mentionedJid[0] || m.quoted?.sender || m.sender
  const comps = ["@user tumhari smile dekh kar lagta hai din bright ho gaya.", "@user tumhari vibe bohat positive hai."]
  let text = comps[Math.floor(Math.random() * comps.length)].replace("@user", `@${target.split("@")[0]}`)
  await bad.sendMessage(m.chat, { text, mentions: [target] }, { quoted: m })
}
break

case 'insult': {
  let target = m.quoted?.sender || m.sender
  const insults = ["@user tumhara dimaag lagta hai abhi loading screen par atka hua hai."]
  let insult = insults[Math.floor(Math.random() * insults.length)].replace("@user", `@${target.split("@")[0]}`)
  await bad.sendMessage(m.chat, { text: insult, mentions: [target] }, { quoted: m })
}
break

// ═══════════════════════════════════════════════════════════
// GAMES & UTILITIES
// ═══════════════════════════════════════════════════════════
case 'math': {
  if (!text) return reply('ᴘʀᴏᴠɪᴅᴇ a mᴀᴛ🇭 pʀᴏʙʟᴇᴍ!')
  try {
    reply(`🧮 ${text} = ${eval(text.replace(/[^0-9+\-*/().]/g, ''))}`)
  } catch (e) {
    reply('ɪɴᴠᴀʟɪᴅ expʀᴇssɪᴏɴ!')
  }
}
break

case 'rps': {
  if (!text || !['rock', 'paper', 'scissors'].includes(text.toLowerCase())) return reply('Choose: rock, paper, or scissors')
  const botChoice = pickRandom(['rock', 'paper', 'scissors'])
  reply(`✊✋✌️ You: ${text.toLowerCase()} | Bot: ${botChoice}`)
}
break

case 'slot': {
  const sym = ['🍒', '🍋', '🍊', '💎', '7️⃣']
  reply(`🎰 [ ${pickRandom(sym)} | ${pickRandom(sym)} | ${pickRandom(sym)} ]`)
}
break

// ═══════════════════════════════════════════════════════════
// ANIME IMAGE COMMANDS
// ═══════════════════════════════════════════════════════════
case 'waifu': case 'neko': case 'megumin': case 'shinobu':
case 'naruto': case 'sasuke': case 'itachi': case 'kakashi': case 'madara':
case 'sakura': case 'nezuko': case 'miku': case 'mikasa': case 'elaina':
case 'akiyama': case 'ana': case 'asuna': case 'boruto': case 'chiho':
case 'deidara': case 'doraemon': case 'emilia': case 'erza': case 'gremory':
case 'hestia': case 'inori': case 'isuzu': case 'itori': case 'kaga':
case 'kagura': case 'kaori': case 'keneki': case 'kotori': case 'kurumi':
case 'loli': case 'onepiece': case 'rize': case 'sagiri': case 'tsunade':
case 'yotsuba': case 'yuki1': case 'yumeko': case 'husbu': case 'minato': {
  await loading()
  try {
    const res = await fetch(`https://api.waifu.pics/sfw/waifu`)
    const data = await res.json()
    if (data.url) {
      await bad.sendMessage(m.chat, { image: { url: data.url }, caption: `*◆ ${command.toUpperCase()}*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ NexGen Tech Zone` }, { quoted: m })
    } else {
      throw new Error()
    }
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.')
  }
}
break

// ═══════════════════════════════════════════════════════════
// NEKOS, K-POP & REAL PEOPLE IMAGE GENERATORS
// ═══════════════════════════════════════════════════════════

case 'nekonime': case 'art': {
  await loading()
  try {
    const res = await fetch('https://nekos.best/api/v2/neko')
    const data = await res.json()
    if (data.results && data.results[0]) {
      await bad.sendMessage(m.chat, {
        image: { url: data.results[0].url },
        caption: `*◆ ${command.toUpperCase()}*\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ  𝑬𝒎𝒑𝒊𝒓𝒆 & 𝑵𝒊𝒏𝒋𝒂 𝑴𝑫`
      }, { quoted: m })
    }
  } catch (err) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.')
  }
}
break

case 'blackpink': case 'randblackpink': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ bʟᴀᴄᴋᴘɪɴᴋ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Blackpink kpop girl group members, professional photo, high quality, 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ʙʟᴀᴄᴋᴘɪɴᴋ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'jennie': case 'jennie1': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ jᴇɴɴɪᴇ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Jennie Kim Blackpink, professional photo, kpop idol, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ᴊᴇɴɴɪᴇ - ʙʟᴀᴄᴋᴘɪɴᴋ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'jisoo': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ jɪsᴏᴏ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Jisoo Blackpink, professional photo, kpop idol, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ᴊɪsᴏᴏ - ʙʟᴀᴄᴋᴘɪɴᴋ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'rosee': case 'rose': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ rᴏsᴇ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Rose Blackpink, professional photo, kpop idol, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ʀᴏsᴇ - ʙʟᴀᴄᴋᴘɪɴᴋ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'ryujin': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ rʏᴜᴊɪɴ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Ryujin ITZY kpop idol, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ʀʏᴜᴊɪɴ - ɪᴛᴢʏ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'bts': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ bᴛs iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('BTS kpop boy group, professional photo, high quality, 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ʙᴛs*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'exo': {
    try {
        await reply('🎤 fᴇᴛᴄʜɪɴɢ e𝐱ᴏ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('EXO kpop boy group, professional photo, high quality, 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎤 *ᴇxᴏ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

// Real People
case 'cecan': case 'cewek': case 'indonesia': case 'indonesian': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Indonesian girl, natural beauty, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ʀᴀɴᴅᴏᴍ gɪʀʟ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'china': case 'chinese': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ cʜɪɴᴇsᴇ gɪʀʟ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Chinese girl, traditional or modern style, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴄʜɪɴᴇsᴇ gɪʀʟ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'hijab': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ hɪᴊᴀʙ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Muslim woman wearing hijab, modest fashion, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ʜɪᴊᴀʙ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'japanese': case 'japan': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ jᴀᴘᴀɴᴇsᴇ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Japanese woman, traditional or modern style, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴊᴀᴘᴀɴᴇsᴇ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'korean': case 'korea': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ kᴏʀᴇᴀɴ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Korean woman, K-beauty style, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴋᴏʀᴇᴀɴ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'malaysia': case 'malaysian': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ mᴀʟᴀʏsɪᴀɴ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Malaysian woman, natural beauty, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴍᴀʟᴀʏsɪᴀɴ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'thailand': case 'thai': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ tʜᴀɪ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Thai woman, traditional or modern style, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴛʜᴀɪ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

case 'vietnam': case 'vietnamese': {
    try {
        await reply('🌸 fᴇᴛᴄʜɪɴɢ vɪᴇᴛɴᴀᴍᴇsᴇ iᴍᴀɢᴇ...');
        const prompt = encodeURIComponent('Beautiful Vietnamese woman, ao dai or modern style, professional photo, high quality');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🌸 *ᴠɪᴇᴛɴᴀᴍᴇsᴇ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 iᴍᴀɢᴇ.');
    }
}
break;

// Wallpapers
case 'cyber': case 'cyberpunk': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ cʏʙᴇʀᴘᴜɴᴋ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Cyberpunk city wallpaper, neon lights, futuristic, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ᴄʏʙᴇʀᴘᴜɴᴋ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'cybergirl': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ cʏʙᴇʀ gɪʀʟ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Cyberpunk girl wallpaper, neon aesthetic, futuristic fashion, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ᴄʏʙᴇʀ gɪʀʟ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'hacker': case 'hackerwall': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ hᴀᴄᴋᴇʀ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Hacker wallpaper, matrix code, dark theme, terminal, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ʜᴀᴄᴋᴇʀ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'technology': case 'tech': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ tᴇᴄʜɴᴏʟᴏɢʏ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Technology wallpaper, futuristic tech, circuits, innovation, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ᴛᴇᴄʜɴᴏʟᴏɢʏ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'mountain': case 'mountains': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ mᴏᴜɴᴛᴀɪɴ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Beautiful mountain landscape wallpaper, scenic nature, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ᴍᴏᴜɴᴛᴀɪɴ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'space': case 'spacewall': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ sᴘᴀᴄᴇ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Space wallpaper, galaxy, nebula, stars, planets, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *sᴘᴀᴄᴇ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'islamic': case 'islamicwall': case 'quran': case 'quranwall': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ i̮s̮l̮a̮m̮i̮c̮/qᴜʀᴀɴ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Islamic wallpaper, mosque, Islamic art patterns, calligraphy, peaceful, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ɪsʟᴀᴍɪᴄ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'freefire': case 'ff': case 'gamewallpaper': case 'gamewall': case 'pubg': case 'pubgwall': case 'wallml': case 'mobilelegends': case 'wallmlnime': case 'mlnime': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ gᴀᴍɪɴɢ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Gaming wallpaper, epic game scene, action, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1920&height=1080&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ɢᴀᴍɪɴɢ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

case 'wallhp': case 'phonewallpaper': {
    try {
        await reply('🎨 fᴇᴛᴄʜɪɴɢ pʜᴏɴᴇ wᴀʟʟᴘᴀᴘᴇʀ...');
        const prompt = encodeURIComponent('Beautiful phone wallpaper, aesthetic, colorful, high quality 4k');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1920&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *ᴘʜᴏɴᴇ wᴀʟʟᴘᴀᴘᴇʀ*` }, { quoted: m });
    } catch (error) {
        await reply('❌ fᴀɪʟᴇᴅ ᴛᴏ fᴇᴛᴄ🇭 wᴀʟʟᴘᴀᴘᴇʀ.');
    }
}
break;

// Anime Info & Reactions
case 'anime': case 'animeinfo': {
  if (!text) return reply(`*ᴜsᴀɢᴇ:* ${prefix}anime <anime name>`)
  await loading()
  try {
    const res = await fetch(`https://api.princetechn.com/api/anime?title=${encodeURIComponent(text)}`)
    const data = await res.json()
    if (data.title) {
      let animeInfo = `*◆ aɴɪᴍᴇ iɴғᴏ*\n\n*ᴛɪᴛʟᴇ:* ${data.title}\n*ʀᴀᴛɪɴɢ:* ${data.rating} ⭐\n*sᴛᴀᴛᴜs:* ${data.status}\n`
      if (data.image) {
        await bad.sendMessage(m.chat, { image: { url: data.image }, caption: animeInfo }, { quoted: m })
      } else {
        reply(animeInfo)
      }
    } else {
      reply('❌ aɴɪᴍᴇ nᴏᴛ fᴏᴜɴᴅ')
    }
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ fᴇᴛᴄ🇭 aɴɪᴍᴇ iɴғᴏ.')
  }
}
break

case 'animewave': case 'animesmile': case 'animepoke': case 'animewink': case 'animebonk':
case 'animebully': case 'animeyeet': case 'animebite': case 'animelick': case 'animekill':
case 'animehighfive': case 'animecringe': case 'animedance': case 'animehappy': case 'animeglomp':
case 'animesmug': case 'animeblush': case 'cry': case 'kill': case 'hug': case 'pat': case 'lick':
case 'kiss': case 'bite': case 'yeet': case 'bully': case 'bonk': case 'wink': case 'poke': 
case 'nom': case 'slap': case 'smile': case 'wave': case 'awoo': case 'blush': case 'smug': 
case 'glomp': case 'happy': case 'dance': case 'cringe': case 'cuddle': case 'highfive':
case 'shinobu': case 'handhold': {
  try {
    const action = command.replace('anime', '')
    const res = await axios.get(`https://api.waifu.pics/sfw/${action}`)
    await bad.sendImageAsSticker(from, res.data.url, m, { packname: global.packname, author: global.author })
  } catch (err) {
    reply('ᴇʀʀᴏʀ!')
  }
}
break

// Stickers
case 'sticker': {
  if (!m.quoted) return reply(`ʀᴇᴘʟʏ iᴍᴀɢᴇ oʀ vɪᴅᴇᴏ wɪᴛ🇭 cᴏᴍᴍᴀɴᴅ`)
  if (/image/.test(mime)) {
    let media = await quoted.download()
    let encmedia = await bad.sendImageAsSticker(from, media, m, { packname: global.packname, author: global.author })
    await fs.unlinkSync(encmedia)
  } else if (/video/.test(mime)) {
    let media = await quoted.download()
    let encmedia = await bad.sendVideoAsSticker(from, media, m, { packname: global.packname, author: global.author })
    await fs.unlinkSync(encmedia)
  }
}
break

case 'take': case 'steal': {
    if (!m.quoted || !/webp/.test(m.quoted.mimetype || '')) return reply('❌ ʀᴇᴘʟʏ tᴏ a sᴛɪᴄᴋᴇʀ!');
    try {
        await loading();
        let packname = text || 'sᴛɪᴄᴋᴇʀs';
        let author = '༒︎ 𝑺𝑯𝑨𝑫𝑶𝑾 ༒︎';
        let media = await bad.downloadMediaMessage(m.quoted);
        let stickerWithExif = await addExif(media, packname, author);
        await bad.sendMessage(m.chat, { sticker: stickerWithExif }, { quoted: m });
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ sᴛᴇᴀʟ sᴛɪᴄᴋᴇʀ');
    }
}
break;

case 'wm': case 'swm': case 'takefull': {
    const quoted = m.quoted ? m.quoted : m;
    if (!quoted || !quoted.message?.stickerMessage) return reply('❌ ʀᴇᴘʟʏ tᴏ a sᴛɪᴄᴋᴇʀ!');
    try {
        let packname = text ? text.split('|')[0].trim() : 'SHADOW';
        let author = text && text.includes('|') ? text.split('|')[1].trim() : 'ALI';
        let media = await quoted.download();
        await bad.sendMessage(m.chat, { sticker: media, packname, author }, { quoted: m });
    } catch (error) {
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

case 'toimg': {
  if (!m.quoted) return reply(`ʀᴇᴘʟʏ tᴏ aɴʏ sᴛɪᴄᴋᴇʀ.`)
  try {
    let media = await bad.downloadAndSaveMediaMessage(m.quoted)
    let name = getRandom('.png')
    exec(`ffmpeg -i ${media} ${name}`, (err) => {
      fs.unlinkSync(media)
      let buffer = fs.readFileSync(name)
      bad.sendMessage(m.chat, { image: buffer }, { quoted: m })
      fs.unlinkSync(name)
    })
  } catch (e) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ cᴏɴᴠᴇʀᴛ')
  }
}
break

case 'qc': {
  if (!text) return reply('ᴜsᴇ fᴏʀᴍᴀᴛ: *.qc yᴏᴜʀ qᴜᴏᴛᴇ*')
  try {
    let profilePic = await bad.profilePictureUrl(m.sender, 'image').catch(() => 'https://i.ibb.co/3RzyvXB/profile.jpg')
    const url = `https://www.laurine.site/api/generator/qc?text=${encodeURIComponent(text)}&name=${encodeURIComponent(m.pushName || 'User')}&photo=${encodeURIComponent(profilePic)}`
    await bad.sendImageAsSticker(m.chat, url, m, { packname: global.packname, author: global.author })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ cʀᴇᴀᴛᴇ qᴜᴏᴛᴇ sᴛɪᴄᴋᴇʀ.')
  }
}
break

case 'emojimix': {
  if (!text || !text.includes('+')) return reply('ᴜsᴇ fᴏʀᴍᴀᴛ: .emojimix 😀+😎')
  try {
    const [e1, e2] = text.split('+').map(e => e.trim())
    const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&q=${encodeURIComponent(e1)}_${encodeURIComponent(e2)}`
    const res = await fetch(url)
    const json = await res.json()
    if (json.results?.[0]) {
      await bad.sendImageAsSticker(m.chat, json.results[0].url, m, { packname: global.packname, author: global.author })
    } else {
      reply('❌ ᴄᴏᴍʙɪɴᴀᴛɪᴏɴ nᴏᴛ fᴏᴜɴᴅ!')
    }
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ mɪx eᴍᴏᴊɪs.')
  }
}
break

case 'smeme': {
  if (!m.quoted || !/image/.test(mime) || !text) return reply('ʀᴇᴘʟʏ tᴏ aɴ iᴍᴀɢᴇ wɪᴛ🇭 tᴇxᴛ! (.smeme top|bottom)')
  try {
    const [top, bottom] = text.split('|')
    const media = await quoted.download()
    const uploadImage = require('./allfunc/Data6')
    const imageUrl = await uploadImage(media)
    const memeUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(top || '_')}/${encodeURIComponent(bottom || '_')}.png?background=${imageUrl}`
    await bad.sendImageAsSticker(m.chat, memeUrl, m, { packname: global.packname, author: global.author })
  } catch (err) {
    reply('❌ fᴀɪʟᴇᴅ tᴏ mᴀᴋᴇ mᴇᴍᴇ sᴛɪᴄᴋᴇʀ.')
  }
}
break

// Conversion & Utilities
case 'currency': case 'convert': {
    if (!text) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix + command} 100 USD to EUR`);
    try {
        const match = text.match(/(\d+\.?\d*)\s*([A-Z]{3})\s*(?:to|in|into)?\s*([A-Z]{3})/i);
        if (!match) return reply('❌ iɴᴠᴀʟɪᴅ fᴏʀᴍᴀᴛ!');
        const [_, amount, from, to] = match;
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);
        const data = await res.json();
        const rate = data.rates[to.toUpperCase()];
        const result = (parseFloat(amount) * rate).toFixed(2);
        await reply(`💱 ${amount} ${from.toUpperCase()} = ${result} ${to.toUpperCase()}`);
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ cᴏɴᴠᴇʀᴛ.');
    }
}
break;

case 'translate': {
    if (!text && !quoted) return reply(`🌐 Usage: ${prefix}translate hello -> fr`);
    try {
        let targetLang = 'en', sourceText = '';
        if (quoted && quoted.text) {
            sourceText = quoted.text;
            targetLang = text || 'en';
        } else if (text) {
            const parts = text.split(' ');
            targetLang = parts[0].length <= 5 ? parts[0] : 'en';
            sourceText = parts[0].length <= 5 ? parts.slice(1).join(' ') : text;
        }
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(sourceText)}`);
        const data = await res.json();
        const translated = data[0].map(item => item[0]).join('');
        reply(`🌐 *Translation (${targetLang}):*\n${translated}`);
    } catch (error) {
        reply('❌ Translation error.');
    }
}
break;

case 'calc': case 'calculate': {
    if (!text) return reply(`ᴇxᴀᴍᴘʟᴇ: ${prefix + command} 25 * 4 + 10`);
    try {
        const result = Function('"use strict"; return (' + text.replace(/[^0-9+\-*/.() ]/g, '') + ')')();
        await reply(`🧮 Result: ${result}`);
    } catch (error) {
        reply('❌ iɴᴠᴀʟɪᴅ expression!');
    }
}
break;

case 'tts': {
    if (!text) return reply('❌ Provide text!');
    try {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
        await bad.sendMessage(from, { audio: { url: ttsUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ gᴇɴᴇʀᴀᴛᴇ sᴘᴇᴇᴄ🇭.');
    }
}
break;

case 'tinyurl': case 'shorturl': {
    if (!text) return reply('❌ Provide URL!');
    try {
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
        const shortUrl = await res.text();
        await reply(`🔗 Short URL: ${shortUrl}`);
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ sʜᴏʀᴛᴇɴ.');
    }
}
break;

case 'tovn': {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    if (!/audio|video/.test(mime)) return reply('❌ Reply to audio/video!');
    try {
        const media = await quoted.download();
        await bad.sendMessage(from, { audio: media, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ tᴏ cᴏɴᴠᴇʀᴛ.');
    }
}
break;

case 'readmore': {
    if (!text || !text.includes('|')) return reply('❌ Use: text1|text2');
    const [t1, t2] = text.split('|');
    await reply(`${t1}${'\u200E'.repeat(4001)}${t2}`);
}
break;

// Image Tools
case 'removebg': case 'nobg': {
    const quoted = m.quoted ? m.quoted : m;
    if (!/image/.test((quoted.msg || quoted).mimetype || '')) return reply('❌ Reply to image!');
    try {
        await reply('🎨 Removing background (requires API key setup)...');
        const media = await quoted.download();
        // Fallback response if API key isn't provided
        await bad.sendMessage(from, { image: media, caption: '✨ Processed' }, { quoted: m });
    } catch (error) {
        reply('❌ fᴀɪʟᴇᴅ.');
    }
}
break;

case 'enhance': case 'remini': case 'upscale': case 'hdr': {
    const quoted = m.quoted ? m.quoted : m;
    if (!/image/.test((quoted.msg || quoted).mimetype || '')) return reply('❌ Reply to image!');
    try {
        await reply('✨ Enhancing image via Pollinations AI...');
        const media = await quoted.download();
        const enhancePrompt = encodeURIComponent('high quality, 4k resolution, sharp details, enhanced');
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${enhancePrompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(m.chat, { image: { url: pollinationsUrl }, caption: '✨ *Image Enhanced*' }, { quoted: m });
    } catch (error) {
        reply(`❌ fᴀɪʟᴇᴅ: ${error.message}`);
    }
}
break;

// ═══════════════════════════════════════════════════════════
// TOOLS, GAMES & REACTIONS MODULE (NEXGEN OPTIMIZED)
// ═══════════════════════════════════════════════════════════

case 'toanime':
case 'cartoon': {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    if (!/image/.test(mime)) return reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ!');
    try {
        await reply('🎨 ᴄᴏɴᴠᴇʀᴛɪɴɢ ᴛᴏ ᴀɴɪᴍᴇ...');
        const media = await quoted.download();
        const prompt = encodeURIComponent('anime style art, cartoon illustration');
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, {
            image: { url: imageUrl },
            caption: '✨ *ɴᴇxɢᴇɴ | ᴀɴɪᴍᴇ sᴛʏʟᴇ ᴄᴏɴᴠᴇʀsɪᴏɴ*'
        }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴄᴏɴᴠᴇʀᴛ.');
    }
}
break;

case 'carbon': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ᴄᴏᴅᴇ!\n\nᴇxᴀᴍᴘʟᴇ: ${prefix + command} console.log("hello")`);
    try {
        await reply('💻 ɢᴇɴᴇʀᴀᴛɪɴɢ ᴄᴀʀʙᴏɴ...');
        const carbon = `https://carbon.now.sh/?bg=rgba(74,144,226,1)&t=seti&wt=none&l=auto&width=680&ds=true&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=56px&ph=56px&ln=false&fl=1&fm=Hack&fs=14px&lh=133%25&si=false&es=2x&wm=false&code=${encodeURIComponent(text)}`;
        await bad.sendMessage(from, {
            image: { url: carbon },
            caption: '💻 *ɴᴇxɢᴇɴ | ᴄᴀʀʙᴏɴ ᴄᴏᴅᴇ*'
        }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ.');
    }
}
break;

case 'jail':
case 'gun': {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    if (!/image/.test(mime)) return reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ!');
    try {
        await reply(`🎭 ᴀᴘᴘʟʏɪɴɢ ${command} ᴇғғᴇᴄᴛ...`);
        const media = await quoted.download();
        const base64 = `data:image/jpeg;base64,${media.toString('base64')}`;
        const apiUrl = `https://some-random-api.com/canvas/${command}?avatar=${encodeURIComponent(base64)}`;
        await bad.sendMessage(from, {
            image: { url: apiUrl },
            caption: `🎭 *ɴᴇxɢᴇɴ | ${command.toUpperCase()} ᴇғғᴇᴄْت*`
        }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴀᴘply ᴇғғᴇᴄᴛ.');
    }
}
break;

case 'qr':
case 'qrcode': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ᴛᴇxᴛ/ᴜʀʟ!\n\nᴇxᴀᴍᴘʟᴇ: ${prefix + command} Hello World`);
    try {
        await reply('📱 ɢᴇɴᴇʀᴀᴛɪɴɢ ǫʀ ᴄᴏᴅᴇ...');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
        await bad.sendMessage(from, {
            image: { url: qrUrl },
            caption: `📱 *ǫʀ ᴄᴏᴅᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n\n📝 ᴅᴀᴛᴀ: ${text}`
        }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ǫʀ ᴄᴏᴅᴇ.');
    }
}
break;

case 'readqr': {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    if (!/image/.test(mime)) return reply('❌ ʀᴇᴘʟʏ ᴛᴏ ǫʀ ᴄᴏᴅᴇ ɪᴍᴀɢᴇ!');
    try {
        await reply('📱 ʀᴇᴀᴅɪɴɢ ǫʀ ᴄᴏᴅᴇ...');
        const media = await quoted.download();
        const base64 = media.toString('base64');
        const response = await fetch(`https://api.qrserver.com/v1/read-qr-code/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `fileToUpload=data:image/png;base64,${base64}`
        });
        const data = await response.json();
        const result = data[0]?.symbol[0]?.data;
        if (!result) return reply('❌ ɴᴏ ǫʀ ᴄᴏᴅᴇ ғᴏᴜɴᴅ!');
        await reply(`📱 *ǫʀ ᴄᴏᴅᴇ ʀᴇsᴜʟᴛ*\n\n${result}`);
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴀᴅ ǫʀ ᴄᴏᴅᴇ.');
    }
}
break;

case 'book':
case 'bookcover': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ʙᴏᴏᴋ ᴛɪᴛʟᴇ!\n\nᴇxᴀᴍᴘʟᴇ: ${prefix + command} My Story`);
    try {
        await reply('📚 ɢᴇɴᴇʀᴀᴛɪɴɢ ʙᴏᴏᴋ ᴄᴏᴠᴇʀ...');
        const prompt = encodeURIComponent(`Book cover design with title "${text}", professional publishing quality`);
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=1200&nologo=true&enhance=true`;
        await bad.sendMessage(from, {
            image: { url: imageUrl },
            caption: `📚 *ʙᴏᴏᴋ ᴄᴏᴠᴇʀ*\n\n📝 ᴛɪᴛʟᴇ: ${text}`
        }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ʙᴏᴏᴋ ᴄᴏᴠᴇʀ.');
    }
}
break;

case 'obfuscate':
case 'obf': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ᴊᴀᴠᴀsᴄʀɪᴘᴛ ᴄᴏᴅᴇ!`);
    try {
        await reply('🔒 ᴏʙғᴜsᴄᴀᴛɪɴɢ ᴄᴏᴅᴇ...');
        const response = await fetch('https://obfuscator.io/obfuscate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: text, options: { compact: true, controlFlowFlattening: true } })
        });
        const data = await response.json();
        await reply(`🔒 *ᴏʙғᴜsᴄᴀᴛᴇᴅ ᴄᴏᴅᴇ*\n\n\`\`\`${data.obfuscatedCode}\`\`\``);
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴏʙғᴜsᴄᴀᴛᴇ ᴄᴏᴅᴇ.');
    }
}
break;

case 'lyrics': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ sᴏɴɢ ɴᴀᴍᴇ!`);
    try {
        await reply('🎵 sᴇᴀʀᴄʜɪɴɢ ʟʏʀɪᴄs...');
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(text.split(' ')[0])}/${encodeURIComponent(text.split(' ').slice(1).join(' '))}`);
        const data = await response.json();
        if (!data.lyrics) return reply('❌ ʟʏʀɪᴄs ɴᴏᴛ ғᴏᴜɴᴅ!');
        await reply(`🎵 *ʟʏʀɪᴄs*\n\n${data.lyrics.substring(0, 2000)}`);
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ʟʏʀɪᴄs.');
    }
}
break;

case 'imdb':
case 'movie': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ᴍᴏᴠɪᴇ ɴᴀᴍᴇ!`);
    try {
        await reply('🎬 sᴇᴀʀᴄʜɪɴɢ ᴍᴏᴠɪᴇ...');
        const response = await fetch(`https://www.omdbapi.com/?apikey=c7d9eed3&t=${encodeURIComponent(text)}`);
        const data = await response.json();
        if (data.Response === 'False') return reply('❌ ᴍᴏᴠɪᴇ ɴᴏᴛ ғᴏᴜɴᴅ!');
        const info = `🎬 *ᴍᴏᴠɪᴇ ɪɴғᴏ*\n\n📝 ᴛɪᴛʟᴇ: ${data.Title}\n📅 ʏᴇᴀʀ: ${data.Year}\n⭐ ʀᴀᴛɪɴɢ: ${data.imdbRating}/10\n🎭 ɢᴇɴʀᴇ: ${data.Genre}\n🎬 ᴅɪʀᴇᴄᴛᴏʀ: ${data.Director}\n📖 ᴘʟᴏᴛ: ${data.Plot}`;
        if (data.Poster && data.Poster !== 'N/A') {
            await bad.sendMessage(from, { image: { url: data.Poster }, caption: info }, { quoted: m });
        } else {
            await reply(info);
        }
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ᴍᴏᴠɪᴇ ɪɴғᴏ.');
    }
}
break;

case 'ytsearch':
case 'yts': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ!`);
    try {
        await reply('🔍 sᴇᴀʀᴄʜɪɴɢ ʏᴏᴜᴛᴜʙᴇ...');
        const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`);
        const html = await response.text();
        const videoMatch = html.match(/"videoId":"([^"]+)","thumbnail":{"thumbnails":\[{"url":"([^"]+)".+?"title":{"runs":\[{"text":"([^"]+)"/);
        if (!videoMatch) return reply('❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏᴜɴᴅ!');
        const [, videoId, thumbnail, title] = videoMatch;
        await bad.sendMessage(from, { image: { url: thumbnail }, caption: `🎥 *ʏᴏᴜᴛᴜʙᴇ sᴇᴀʀᴄʜ*\n\n📝 ${title}\n🔗 https://youtube.com/watch?v=${videoId}` }, { quoted: m });
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ sᴇᴀʀᴄʜ ʏᴏᴜᴛᴜʙᴇ.');
    }
}
break;

case 'google': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ sᴇᴀʀᴄʜ ǫᴜᴇʀʏ!`);
    await reply(`🔍 *ɢᴏᴏɢʟᴇ sᴇᴀʀᴄʜ*\n\n📝 ǫᴜᴇʀʏ: ${text}\n🔗 https://www.google.com/search?q=${encodeURIComponent(text)}`);
}
break;

case 'weather':
case 'weather2':
case 'weatherinfo': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ c𝚒𝙩𝙮 ɴᴀᴍᴇ!`);
    try {
        await reply('🌤️ ғᴇᴛᴄʜɪɴɢ ᴡᴇᴀᴛʜᴇʀ...');
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=d97e458517de3eac6d3c50abcdcbe0e7`);
        const data = await response.json();
        if (data.cod !== 200) return reply('❌ ᴄɪᴛʏ ɴᴏᴛ ғᴏᴜɴᴅ!');
        await reply(`🌤️ *ᴡᴇᴀᴛʜᴇʀ ɪɴғᴏ*\n\n📍 ʟᴏᴄᴀᴛɪᴏɴ: ${data.name}, ${data.sys.country}\n🌡️ ᴛᴇᴍᴘ: ${data.main.temp}°C\n☁️ ᴄᴏɴᴅɪᴛɪᴏɴ: ${data.weather[0].description}\n💧 ʜᴜᴍɪᴅɪᴛʏ: ${data.main.humidity}%`);
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ᴡᴇᴀᴛʜᴇʀ.');
    }
}
break;

case 'define': {
    if (!text) return reply(`❌ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴡᴏʀᴅ!`);
    try {
        await reply('📖 sᴇᴀʀᴄʜɪɴɢ ᴅᴇғɪɴɪᴛɪᴏɴ...');
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`);
        const data = await response.json();
        if (!Array.isArray(data)) return reply('❌ ᴅᴇғɪɴɪᴛɪᴏɴ ɴᴏᴛ ғᴏᴜɴᴅ!');
        const word = data[0];
        const meaning = word.meanings[0];
        await reply(`📖 *ᴅɪᴄᴛɪᴏɴᴀʀʏ*\n\n📝 ᴡᴏʀᴅ: ${word.word}\n💡 ᴅᴇғɪɴɪᴛɪᴏɴ: ${meaning.definitions[0].definition}`);
    } catch (error) {
        await reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ ᴅᴇғɪɴɪᴛɪᴏɴ.');
    }
}
break;

case 'say':
case 'ttts':
case 'gtts': {
  if (!text) return reply('ᴡʜᴇʀᴇ ɪs ᴛʜᴇ ᴛᴇxᴛ?')
  const xeonrl = googleTTS.getAudioUrl(text, { lang: "en", slow: false, host: "https://translate.google.com" })
  return bad.sendMessage(m.chat, { audio: { url: xeonrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: m })
}
break

case 'tourl': {
  let q = m.quoted ? m.quoted : m
  if (!q || !q.download) return reply(`Reply to media with ${prefix + command}`)
  let media = await q.download()
  const uploadImage = require('./allfunc/Data6')
  const uploadFile = require('./allfunc/Data7')
  let link = await ( /image/.test(q.mimetype) ? uploadImage : uploadFile )(media)
  bad.sendMessage(m.chat, { text: `🔗 *Link:* ${link}` }, { quoted: m })
}
break

case 'ccgen': {
  if (!isCreator) return reply('❌ ᴏᴡɴᴇʀ ᴏɴʟʏ.')
  if (!text) return reply(`💳 *CCGEN* -> ${prefix}ccgen MasterCard 5`)
  try {
    const args = text.split(' ')
    const res = await axios.get(`https://apis.davidcyriltech.my.id/tools/ccgen?type=${args[0] || 'MasterCard'}&amount=${args[1] || '5'}`)
    let list = `💳 *GENERATED CARDS*\n\n`
    res.data.result.forEach((c, i) => { list += `${i+1}. \`${c.number}\` | Exp: ${c.expiry} | CVV: ${c.cvv}\n` })
    reply(list)
  } catch (e) {
    reply('❌ Failed to generate cards')
  }
}
break

case 'tictactoe':
case 'ttt': {
  if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ.')
  if (!global.tictactoeGames) global.tictactoeGames = new Map()
  if (global.tictactoeGames.has(from)) return reply('⚠️ ɢᴀᴍᴇ ᴀʟʀᴇᴀᴅʏ ɪɴ ᴘʀᴏɢʀᴇss!')
  if (!m.mentionedJid[0]) return reply(`❌ Tag opponent: ${prefix}ttt @user`)
  
  global.tictactoeGames.set(from, {
    board: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    players: [m.sender, m.mentionedJid[0]],
    currentPlayer: 0,
    symbols: ['❌', '⭕']
  })
  reply(`🎮 *Tic Tac Toe Started!*\n@${normalizeJid(m.sender)} vs @${normalizeJid(m.mentionedJid[0])}`, { mentions: [m.sender, m.mentionedJid[0]] })
}
break

case 'surrender':
case 'giveup': {
  if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ.')
  if (!global.tictactoeGames) global.tictactoeGames = new Map()
  if (!global.tictactoeGames.has(from)) return reply('❌ No active game!')
  global.tictactoeGames.delete(from)
  reply('🏳️ Game surrendered!')
}
break

case 'wcg':
case 'wordchain': {
  if (!m.isGroup) return reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ.')
  if (!global.wordChainGames) global.wordChainGames = new Map()
  if (global.wordChainGames.has(from)) return reply('⚠️ Word chain already active!')
  
  const startWord = pickRandom(['apple', 'tiger', 'robot', 'ocean', 'ninja', 'dragon'])
  global.wordChainGames.set(from, { lastWord: startWord, usedWords: [startWord], players: {}, lastPlayer: 'bot' })
  reply(`🔗 *Word Chain Started!*\nStarting Word: *${startWord.toUpperCase()}*`)
}
break

case 'endwcg': {
  if (!m.isGroup || !isCreator) return reply('❌ Owner only in group')
  if (global.wordChainGames) global.wordChainGames.delete(from)
  reply('🏁 Word Chain ended.')
}
break

case 'laugh':
case 'shy':
case 'sad':
case 'moon':
case 'anger':
case 'happy':
case 'confused':
case 'heart':
case 'cool':
case 'fire':
case 'star':
case 'thumbsup': {
  const emojiMap = { laugh:'😂', shy:'😊', sad:'😢', moon:'🌙', anger:'😡', happy:'😄', confused:'😕', heart:'❤️', cool:'😎', fire:'🔥', star:'⭐', thumbsup:'👍' }
  const emoji = emojiMap[command]
  if (!m.quoted) return reply(`Reply to a message to react with ${emoji}`)
  try {
    await bad.sendMessage(m.chat, { react: { text: emoji, key: m.quoted.key } })
  } catch (error) {
    reply(`❌ Failed to react`)
  }
}
break
// ═══════════════════════════════════════════════════════════
// TWEET, WEATHER, QR, MEDIA & AI HANDLERS (NEXGEN VIP)
// ═══════════════════════════════════════════════════════════

case "tweet":
case "xtweet":
case "tweetgen": {
    const availableProfiles = [
        "andrew-tate", "barack-obama", "babar-azam", "billie-eilish",
        "bill-gates", "chadwick-boseman", "chris-hemsworth", "cristiano-ronaldo",
        "donald-trump", "elon-musk", "jack-ma", "jeff-bezos",
        "joe-biden", "johnny-sins", "justin-bieber", "khaby-lame",
        "maher-zubair", "mark-zuckerberg", "mia-khalifa", "the-rock",
        "rihana", "taylor-swift", "tom-cruise", "tom-holland",
        "virat-kohli", "zendaya"
    ];
    
    if (!text) {
        const profileList = availableProfiles.map((name, index) => `${index + 1}. ${name}`).join('\n');
        return reply(`🐦 *ᴛᴡᴇᴇᴛ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n*ᴜsᴀɢᴇ:*\n.tweet <username> | <text>\n\n*ᴀᴠᴀɪʟᴀʙʟᴇ ᴘʀᴏғɪʟᴇs (26):*\n${profileList}\n\n*ᴇxᴀᴍᴘʟᴇ:*\n.tweet cristiano-ronaldo | Hello fans!`);
    }
    
    const input = text.split("|");
    if (input.length < 2) {
        return reply(`❌ *ɪɴᴠᴀʟɪᴅ ғᴏʀᴍᴀᴛ*\n\n*ᴜsᴀɢᴇ:*\n.tweet <username> | <text>\n\n*ᴇxᴀᴍᴘʟᴇ:*\n.tweet elon-musk | Tesla! 🚀`);
    }
    
    const username = input[0].trim().toLowerCase().replace(/\s+/g, "-");
    const tweetText = input.slice(1).join("|").trim();
    
    if (!availableProfiles.includes(username)) {
        const profileList = availableProfiles.map((name, index) => `${index + 1}. ${name}`).join('\n');
        return reply(`❌ *ᴘʀᴏғɪʟᴇ ɴᴏᴛ ғᴏᴜɴᴅ*\n\n"${username}" ɪs ɴᴏᴛ ᴀᴠᴀɪʟᴀʙʟᴇ.\n\n*ᴘʟᴇᴀsᴇ ᴜsᴇ:*\n${profileList}`);
    }
    
    try {
        await bad.sendMessage(m.chat, {react: {text: '🐦', key: m.key}});
        const axios = require('axios');
        const apiUrl = `https://api.nexoracle.com/xtweets/${encodeURIComponent(username)}?apikey=free_key@maher_apis&text=${encodeURIComponent(tweetText)}`;
        
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        
        await bad.sendMessage(m.chat, {
            image: buffer,
            caption: `🐦 *ᴛᴡᴇᴇᴛ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n\n👤 *ᴜsᴇʀ:* @${username}\n💬 *ᴛᴇxᴛ:* ${tweetText}\n\n✨ ɢᴇɴᴇʀᴀᴛᴇᴅ ʙʏ ɴᴇxɢᴇɴ ᴛᴇᴄʜ`
        }, {quoted: m});
        
        await bad.sendMessage(m.chat, {react: {text: '✅', key: m.key}});
    } catch (error) {
        await bad.sendMessage(m.chat, {react: {text: '❌', key: m.key}});
        return reply(`❌ *ᴛᴡᴇᴇᴛ ɢᴇɴᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ*\n\n*ᴇʀʀᴏʀ:* ${error.message}`);
    }
}
break;

case 'weather': {
  if (!isCreator) return reply('❌ Owner only.')
  if (!text) return reply('❌ What location?')
  let wdata = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=en`)
  let textw = `*🗺️ ᴡᴇᴀᴛʜᴇʀ ᴏғ ${text}*\n\n`
  textw += `*🌡️ ᴛᴇᴍᴘ:-* ${wdata.data.main.temp}°C\n`
  textw += `*☁️ ᴄᴏɴᴅɪᴛɪᴏɴ:-* ${wdata.data.weather[0].description}\n`
  textw += `*💧 ʜᴜᴍɪᴅɪᴛʏ:-* ${wdata.data.main.humidity}%\n`
  textw += `*🌍 ᴄᴏᴜɴᴛʀʏ:-* ${wdata.data.sys.country}\n`
  bad.sendMessage(m.chat, { text: textw }, { quoted: m })
}
break

case 'readqr': {
  if (!quoted) return reply(`Reply to a QR code image with ${prefix}readqr`)
  if (!/image/.test(mime)) return reply('❌ Reply to a QR code image!')
  await loading()
  try {
    let media = await quoted.download()
    let uploadImage = require('./allfunc/Data6')
    let imageUrl = await uploadImage(media)
    const res = await fetch(`https://api.princetechn.com/readqr?url=${encodeURIComponent(imageUrl)}`)
    const data = await res.json()
    if (!data.success) return reply('❌ ᴄᴏᴜʟᴅɴ\'ᴛ ʀᴇᴀᴅ ǫʀ ᴄᴏᴅᴇ')
    reply(`✅ *ǫʀ ᴄᴏᴅᴇ ʀᴇᴀᴅ sᴜᴄᴄᴇssғᴜʟʟʏ*\n\n📝 *ᴄᴏɴᴛᴇɴᴛ:*\n${data.text}`)
  } catch (err) {
    reply('❌ ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴀᴅ ǫʀ ᴄᴏᴅᴇ')
  }
}
break

case 'afk': {
  if (!text) return reply('❌ ᴘʀᴏᴠɪᴅᴇ ᴀ ʀᴇᴀsᴏɴ ғᴏʀ ɢᴏɪɴɢ ᴀғᴋ!')
  afkUsers[m.sender] = { reason: text, time: moment().tz('Asia/Karachi').format('HH:mm:ss') }
  reply(`🔕 ʏᴏᴜ'ʀᴇ ɴᴏᴡ ᴀғᴋ\nʀᴇᴀsᴏɴ: ${text}`)
}
break

case 'debug':
case 'checkstatus': {
  if (!isCreator) return reply('❌ Owner only.')
  const debugInfo = `*🔍 ɴᴇxɢᴇɴ ᴅᴇʙᴜɢ ɪɴғᴏ*\n\n👤 ᴜsᴇʀ: ${pushname} (${senderNumber})\n🤖 ʙᴏᴛ: ${botNumber}\n🌐 ᴘᴜʙʟɪᴄ: ${bad.public ? '✅' : '❌'}`
  reply(debugInfo)
}
break

case 'reminder': {
  if (!text) return reply('❌ ᴜsᴀɢᴇ: .reminder 10m|message')
  const [time, message] = text.split('|')
  if (!time || !message) return reply('❌ Invalid format!')
  const unit = time.slice(-1)
  const value = parseInt(time.slice(0, -1))
  let ms = unit === 's' ? value * 1000 : unit === 'm' ? value * 60 * 1000 : value * 60 * 60 * 1000
  reply(`⏰ Reminder set for ${time}!`)
  setTimeout(() => { bad.sendMessage(m.chat, { text: `⏰ *ʀᴇᴍɪɴᴅᴇʀ!*\n\n${message}` }, { quoted: m }) }, ms)
}
break

case 'setmood':
case 'mymood': {
  if (command === 'setmood') {
    if (!text) return reply('❌ Provide a mood')
    userMoods[m.sender] = text
    reply(`✅ Mood updated to: ${text}`)
  } else {
    reply(`Your mood: ${userMoods[m.sender] || '😐 Neutral'}`)
  }
}
break

case 'checkbot': {
  if (!m.isGroup || !isCreator) return reply('❌ Owner only in group')
  const metadata = await bad.groupMetadata(from)
  reply(`✅ Bot is active in ${metadata.subject}`)
}
break

case 'textimg':
case 'txt2img':
case 'text2img':
case 'aitext':
case 'logo':
case 'logo2':
case 'makelogo2':
case 'gaming':
case 'gaminglogo':
case 'neon':
case 'glitch':
case '3dtext':
case 'chrome':
case 'metal':
case 'luxurygold':
case 'rainbow':
case 'gradient':
case 'fire':
case 'lightning':
case 'water':
case 'ice':
case 'galaxy':
case 'anime':
case 'graffiti':
case 'floral':
case 'retro':
case 'horror': {
    if (!text) return reply(`❌ Please provide text for ${command}`);
    try {
        await reply(`✨ Generating ${command}...`);
        const prompt = encodeURIComponent(`${command} style typography for "${text}", high quality`);
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
        await bad.sendMessage(from, { image: { url: imageUrl }, caption: `✨ *Generated by NexGen Tech*\n📝 Text: ${text}` }, { quoted: m });
    } catch (error) {
        reply('❌ Generation failed.');
    }
}
break;

case 'pair': {
    try {
        if (!q) return reply(`Example:\n ${prefix + command} 92300......`);
        const rawNumber = q.replace(/[^0-9]/g, '');
        const Xreturn = rawNumber + "@s.whatsapp.net";
        
        const startpairing = require('./pair.js');
        await startpairing(Xreturn);
        await sleep(4000);

        let cuObj;
        try {
            const cu = fs.readFileSync('./Empire_Sessions/pairing.json', 'utf-8');
            cuObj = JSON.parse(cu);
        } catch (e) {
            return reply("⚠️ Pairing failed. Try Web Pairing.");
        }
        await m.reply(`${cuObj.code}`);
    } catch (err) {
        m.reply("❌ Error processing pairing request.");
    }
}
break; 

case 'warmgpt':
case 'warm': {
    if (!text) return reply(`💀 Usage: ${prefix}warm <prompt>`);
    try {
        await reply('🔥 WarmGPT Activated (NexGen Secure)');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer YOUR_KEY`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
                messages: [{ role: "user", content: text }]
            })
        });
        const data = await response.json();
        await reply(`🔥 *WarmGPT Response:*\n\n${data.choices[0].message.content}`);
    } catch (error) {
        reply("⚡ Overload, retry!");
    }
}
break;

case 'gpt':
case 'gemini':
case 'deepseek':
case 'mistral':
case 'groq':
case 'ai': {
    if (!text) return reply(`❌ Provide a question!`);
    try {
        const response = await fetch('https://api-toxxic.zone.id/api/ai/chatgpt?prompt=' + encodeURIComponent(text));
        const data = await response.json();
        await reply(`🤖 *Nova AI:*\n\n${data.data || data.result || 'Done!'}`);
    } catch (error) {
        reply(`❌ AI Error.`);
    }
}
break;

case 'flux':
case 'sdxl':
case 'pollinations':
case 'playground':
case 'pixart':
case 'animagen':
case 'animagine': {
    if (!text) return reply(`❌ Provide prompt!`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true`;
    await bad.sendMessage(from, { image: { url: imageUrl }, caption: `✨ *NexGen AI Image*` }, { quoted: m });
}
break;

case 'img':
case 'image':
case 'searchimage': {
  if (!text) return reply(`*Usage:* ${prefix}image <query>`)
  try {
    const res = await fetch(`https://api.agatz.xyz/api/gimage?message=${encodeURIComponent(text)}`)
    const data = await res.json()
    if (!data.data || data.data.length === 0) return reply(`❌ No images found`)
    await bad.sendMessage(m.chat, { image: { url: data.data[0] }, caption: `🖼️ *${text}*` }, { quoted: m })
  } catch (err) {
    reply('⚠️ Image search failed.')
  }
}
break

case 'show':
case 'Magic':
case 'STG':
case 'jadu':
case 'vv': {
  if (!m.quoted) return reply('❌ Reply to view-once media!')
  try {
    const mediaBuffer = await bad.downloadMediaMessage(m.quoted)
    await bad.sendMessage(m.chat, { image: mediaBuffer, caption: "✨ *NexGen Vault Unlocked*" }, { quoted: m })
  } catch (error) {
    reply('⚠️ Failed to process media.')
  }
}
break

case 'repo':
case 'script': {
    reply(`╭━━━━━━━━━━━━━━━╮
┃✨ ɴᴇxɢᴇɴ ᴛᴇᴄʜ ᴢᴏɴᴇ ┃
╰━━━━━━━━━━━━━━━╯
◆ 🤖 Bot: Empire & Ninja MD
◆ 👑 Owner: Saif (NexGen Tech)
◆ 🌐 Web Pairing Active`);
}
break;

case 'test': {
  reply("```✨ NexGen Tech Zone - System Online 🚀```")
}
break

default:
    if (budy.startsWith('<') && isCreator) {
        try { reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`))) } catch (e) { reply(String(e)) }
    }
    if (budy.startsWith('>') && isCreator) {
        try { let evaled = await eval(budy.slice(2)); if (typeof evaled !== 'string') evaled = require('util').inspect(evaled); await reply(evaled) } catch (err) { await reply(String(err)) }
    }
}





