/**
 * Developer: Dark Empire (NexGen Tech)
 * Project: NexGen Tech Zone Files
 * Description: Express.js Web Pairing API for Empire-&-Ninja_MD_Bot
 */

const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS settings taake Vercel ki website isay access kar sake
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

// 🌐 API Endpoint: Generate Pairing Code
app.get('/api/pair', async (req, res) => {
    let phone = req.query.phone;
    
    // Agar number na mile
    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required!" });
    }

    // Number ko clean karna (sirf digits rakhna)
    phone = phone.replace(/[^0-9]/g, '');

    // Har naye user ke liye alag session folder (Empire_Sessions ke andar)
    const sessionDir = path.join(__dirname, 'Empire_Sessions', phone);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        // Baileys Socket Setup
        const sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        // Agar user pehle se registered nahi hai, toh code generate karo
        if (!sock.authState.creds.registered) {
            // Thora delay taake socket initialize ho jaye
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phone);
                    // Code ko XXXX-XXXX format mein karna (optional but looks good)
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    
                    console.log(`[ NexGen ] Pairing Code Generated for ${phone}: ${code}`);
                    res.json({ success: true, code: code });
                } catch (codeError) {
                    console.error("Code Generation Error:", codeError);
                    if (!res.headersSent) res.status(500).json({ success: false, message: "Failed to generate code." });
                }
            }, 3000);
        } else {
            res.json({ success: false, message: "Number is already paired!" });
        }

        // Credentials save aur connection update handle karna
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log(`✅ [ NexGen ] Session ACTIVE for ${phone}`);
                // [NOTE FOR STEP 3]: Yahan par hum code likhenge jo Supabase database mein 
                // is user ka status 'Active' kar dega taake tum dashboard par dekh sako!
            } else if (connection === 'close') {
                console.log(`❌ [ NexGen ] Connection closed for ${phone}`);
            }
        });

    } catch (error) {
        console.error("[ NexGen Error ]:", error);
        if (!res.headersSent) res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Empire & Ninja API is running on http://localhost:${PORT}`);
    console.log(`🌐 Ready to connect with Vercel Frontend!`);
});
