// File: data6.js (NexGen Tech Zone Optimized)

const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

/**
 * NexGen Media Uploader
 * Uploads media (image/video) to catbox.moe
 * Supported mimetypes:
 * - `image/jpeg`
 * - `image/png`
 * - `video/mp4`, etc.
 * @param {Buffer} buffer Media Buffer
 */
module.exports = async (buffer) => {
  try {
    // Buffer se extension (file type) nikalna
    let { ext } = await fromBuffer(buffer);
    
    let bodyForm = new FormData();
    // File upload hote waqt naam nexgen_media rakha jayega
    bodyForm.append("fileToUpload", buffer, "nexgen_media." + ext);
    bodyForm.append("reqtype", "fileupload");

    // Catbox API par POST request
    let res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm,
    });

    let data = await res.text();
    return data; // Uploaded file ka URL return karega

  } catch (error) {
    console.error("[ NexGen Error ] Media Upload Failed:", error.message);
    return false; // Error aane par bot crash nahi hoga
  }
}

// Powered By Empire And Ninja Tech
