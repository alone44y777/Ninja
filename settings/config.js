/**
 * Developer: Saif (NexGen Tech)
 * Project: NexGen Tech Zone Files
 * Description: Global Configuration for Empire-&-Ninja_MD_Bot
 */

const fs = require('fs')

global.owner = "923XXXXXXXXX" // <-- Yahan apna WhatsApp number dalen (Bina + ke)
global.footer = "Empire-&-Ninja_MD_Bot"
global.status = false // "self/public" section of the bot
global.prefa = ['','!','.','#','&','/','@']
global.owner = ['923XXXXXXXXX']
global.xprefix = '.'
global.gambar = "https://files.catbox.moe/example.jpg" // Default placeholder image
global.OWNER_NAME = "Empire (NexGen Tech)"
global.DEVELOPER = ["923XXXXXXXXX"]
global.BOT_NAME = "Empire-&-Ninja_MD_Bot"
global.bankowner = "NexGen Tech Zone"
global.creatorName = "Saif"
global.ownernumber = '923XXXXXXXXX'
global.location = "Pakistan, Punjab"
global.prefa = ['','!','.','#','&']

//================DO NOT CHANGE OR YOU'LL GET AN ERROR=============\
global.gcmess = "⚠️ *Access Denied:* This command can only be used inside groups."
global.adminmess = "⚠️ *Admin Restriction:* This feature is restricted to group admins only."
global.premmess = "⚠️ *Restricted Feature:* This feature is reserved for premium users."
global.dev = "923XXXXXXXXX"
global.creatorName = "𝐃ᴀʀᴋ-𝐄ᴍᴘɪʀᴇ "
global.footer = "Powered By Empire-&-Ninja_MD_Bot"
global.link = "https://whatsapp.com/channel/0029Vb6PBrd7oQhbvDd0Jp1h" // Tumhara official channel link
global.autobio = true // Auto update bio
global.botName = "Empire-&-Ninja_MD_Bot"
global.version = "V2"
global.botname = "Empire-&-Ninja_MD_Bot"
global.author = "NexGen Tech"
global.themeemoji = '⚡'
global.wagc = 'https://whatsapp.com/channel/0029Vb6PBrd7oQhbvDd0Jp1h'
global.thumbnail = 'https://files.catbox.moe/example.jpg'
global.richpp = 'https://files.catbox.moe/example.jpg'
global.packname = "EMPIRE & NINJA STICKERS"
global.author = "NexGen Tech"
global.creator = "923XXXXXXXXX@s.whatsapp.net"
global.ownername = 'Saif (NexGen Tech)' 

global.onlyowner = `🚫 *Sorry, This Feature Is Restricted To Owners Only.*\nContact *Saif* to gain owner privileges.`
global.database = `⚠️ *Database Error:* No entry without approval from administration.`

global.mess = {
   wait: "```🔄 Processing request... Please wait.```",
   success: "✔️ *Success!* Command executed successfully.",
   on: "✔️ *Empire-&-Ninja_MD_Bot is now ACTIVE.*", 
   prem: "⛧ *Premium Access Only:* Upgrade your rank to use this feature.", 
   off: "❌ *Empire-&-Ninja_MD_Bot is now OFFLINE.*",
   query: {
       text: "Please provide text for this command!",
       link: "Please provide a valid link!",
   },
   error: {
       fitur: "Sorry, this feature encountered an error. Please report it to the developer.",
   },
   only: {
       group: "Sorry, this feature can only be used in group chats!",
       private: "Sorry, this feature can only be used in private chats!",
       owner: "Sorry, this command is restricted to the bot owner only!",
       admin: "Sorry, this feature can only be used by group admins!",
       badmin: "Sorry, you cannot use this because the bot is not yet a group admin!",
       premium: "This feature is specifically for authorized users.",
   }
}

global.hituet = 0
global.autoRecording = false 
global.autoTyping = false 
global.autorecordtype = false 
global.autoread = false 
global.autobio = true 
global.anti92 = false // False rakha hai taake block na ho
global.autoswview = true 

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
  
