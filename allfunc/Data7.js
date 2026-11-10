// File: data7.js (NexGen Tech Zone Optimized)

const fetch = require('node-fetch')
const FormData = require('form-data')
const { fromBuffer } = require('file-type')

/**
 * NexGen Temporary File Uploader (file.io)
 * `Expired in 1 day`
 * `100MB Max Filesize`
 * @param {Buffer} buffer File Buffer
 */
const fileIO = async buffer => {
  const { ext } = await fromBuffer(buffer) || {}
  let form = new FormData
  // File ka naam "nexgen_file" rakha gaya hai
  form.append('file', buffer, 'nexgen_file.' + ext)
  let res = await fetch('https://file.io/?expires=1d', { 
    method: 'POST',
    body: form
  })
  let json = await res.json()
  if (!json.success) throw json
  return json.link
}

/**
 * NexGen Backup Storage Uploader (RESTfulAPI)
 * @param {Buffer|ReadableStream|(Buffer|ReadableStream)[]} inp File Buffer/Stream
 * @returns {string|null|(string|null)[]}
 */
const RESTfulAPI = async inp => {
  let form = new FormData
  let buffers = inp
  if (!Array.isArray(inp)) buffers = [inp]
  for (let buffer of buffers) {
    form.append('file', buffer)
  }
  let res = await fetch('https://storage.restfulapi.my.id/upload', {
    method: 'POST',
    body: form
  })
  let json = await res.text()
  try {
    json = JSON.parse(json)
    if (!Array.isArray(inp)) return json.files[0].url
    return json.files.map(res => res.url)
  } catch (e) {
    throw json
  }
}

// Main Export Function with Fallback Logic
module.exports = async function (inp) {
  let err = false
  // Pehle RESTful try karega, agar fail hua toh file.io par jayega
  for (let upload of [RESTfulAPI, fileIO]) {
    try {
      return await upload(inp)
    } catch (e) {
      err = e
      console.log(`[ NexGen Warning ] Uploader fail hua, backup server try kar raha hoon...`)
    }
  }
  if (err) {
      console.error(`[ NexGen Error ] Dono uploaders fail ho gaye!`);
      throw err;
  }
}

// Powered By Empire And Ninja Tech
