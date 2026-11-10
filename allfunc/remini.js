/**
 * Developer: Devp Dark Empire
 * Brand: NexGen Tech Zone
 * Powered By Empire And Ninja Tech
 * Description: Remini AI Image Enhancer (Decoded & Optimized)
 */

const FormData = require('form-data');
const Jimp = require('jimp'); // Agar future processing chahiye ho

/**
 * NexGen AI Image Enhancer
 * @param {Buffer} imageBuffer - The image buffer to enhance
 * @param {String} method - Method: 'enhance', 'dehaze', or 'recolor'
 * @returns {Promise<Buffer>} - Returns enhanced image buffer
 */
async function remini(imageBuffer, method = 'enhance') {
    return new Promise(async (resolve, reject) => {
        try {
            // Allowed methods validation
            let validMethods = ['enhance', 'dehaze', 'recolor'];
            if (!validMethods.includes(method)) {
                method = 'enhance';
            }

            // Vyro AI (Remini API) configuration
            const baseUrl = `https://inferenceengine.vyro.ai/${method}`;
            let form = new FormData();
            
            // Appending required API parameters
            form.append('model_version', '1', {
                'Content-Transfer-Encoding': 'binary',
                'contentType': 'multipart/form-data; charset=utf-8'
            });
            
            // Appending Image
            form.append('image', Buffer.from(imageBuffer), {
                'filename': 'enhance_image_body.jpg',
                'contentType': 'image/jpeg'
            });

            // Sending POST request to Vyro API
            form.submit({
                url: baseUrl,
                host: 'inferenceengine.vyro.ai',
                path: `/${method}`,
                protocol: 'https:',
                headers: {
                    'User-Agent': 'okhttp/4.9.3',
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip'
                }
            }, function (err, res) {
                if (err) {
                    console.error("[ NexGen Error ] Remini API Connection Failed:", err);
                    return reject(err);
                }

                let chunks = [];
                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });

                res.on('error', (e) => {
                    console.error("[ NexGen Error ] Remini Response Error:", e);
                    reject(e);
                });
            });

        } catch (error) {
            console.error("[ NexGen Error ] Remini Process Crash:", error);
            reject(error);
        }
    });
}

module.exports.remini = remini;
