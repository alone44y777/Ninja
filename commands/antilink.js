/**
 * Developer: Devp Dark Empire
 * Project: NexGen Tech Zone Files
 * Description: Anti-Link Command Toggle
 */

const { cmd } = require('../command');
const config = require("../config");

cmd({
  pattern: "antilink",
  desc: "Enable/disable anti-link protection",
  category: "group",
  fromMe: true, // Sirf owner use kar sakta hai
  use: '<on/off>'
}, async (m, match) => {
  
  // Group ke bahar command check
  if (!m.isGroup) return m.reply("❌ *Empire & Ninja MD:* This command only works in groups!");
  
  // Argument (on/off) ko safely read karna
  let action = '';
  if (typeof match === 'string') {
      action = match.trim().toLowerCase();
  } else if (Array.isArray(match)) {
      action = match[1] ? match[1].toLowerCase() : (match[0] ? match[0].toLowerCase() : '');
  }

  // ON Logic
  if (action === 'on') {
    config.ANTI_LINK = 'true';
    await m.reply("✅ *Anti-Link Enabled!*\n\nLinks will now be auto-deleted.\n_Powered By Empire & Ninja MD Bot_");
  } 
  // OFF Logic
  else if (action === 'off') {
    config.ANTI_LINK = 'false';
    await m.reply("❌ *Anti-Link Disabled!*\n\nLinks are now allowed in this group.\n_Powered By Empire & Ninja MD Bot_");
  } 
  // Status Logic
  else {
    await m.reply(`🔍 *Empire & Ninja Anti-Link Status:* ${config.ANTI_LINK === 'true' ? '✅ ENABLED' : '❌ DISABLED'}\n\n*Usage:* .antilink on  ya  .antilink off`);
  }
});
