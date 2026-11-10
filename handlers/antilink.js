/**
 * Developer: Devp Dark Empire
 * Project: NexGen Tech Zone Files
 * Description: Anti-Link Protection Engine for Empire & Ninja MD Bot
 */

const { cmd } = require('../command');
const config = require("../config");

cmd({
  on: "body" // Listens to all incoming messages
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {
    // Global warnings object initialization
    if (!global.warnings) global.warnings = {};
    
    // Conditions check: Group hona chahiye, sender admin nahi hona chahiye, bot admin hona chahiye, aur anti-link ON hona chahiye
    if (!isGroup || isAdmins || !isBotAdmins || config.ANTI_LINK !== 'true') return;

    // Comprehensive Link Detection Regex Patterns (WhatsApp, Telegram, Web URLs)
    const linkPatterns = [
      /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
      /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
      /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
      /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
    ];

    // Check if message body contains any link
    if (linkPatterns.some(pattern => pattern.test(body))) {
      
      // Step 1: Delete the offending link message instantly
      try {
        await conn.sendMessage(from, { delete: m.key });
      } catch (e) { 
        console.log("[ NexGen Warning ] Failed to delete link message:", e); 
      }

      // Step 2: Track warnings per user in the group
      global.warnings[sender] = (global.warnings[sender] || 0) + 1;
      
      // Step 3: Action based on warning count (Kick on 3rd warning)
      if (global.warnings[sender] >= 3) {
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        delete global.warnings[sender];
        
        await conn.sendMessage(from, {
          text: `🚫 *User Removed!*\n@${sender.split('@')[0]} has been removed for spamming links (3/3 Warnings).\n\n_Powered By Empire & Ninja MD Bot_`,
          mentions: [sender]
        });
      } else {
        // Warning notification
        await conn.sendMessage(from, {
          text: `⚠️ *Anti-Link Warning (${global.warnings[sender]}/3)*\n@${sender.split('@')[0]}, links are strictly not allowed in this group!\n\n_Powered By Empire & Ninja MD Bot_`,
          mentions: [sender]
        });
      }
    }
  } catch (error) {
    console.error("[ NexGen Error ] Anti-link handler error:", error);
  }
});
  
