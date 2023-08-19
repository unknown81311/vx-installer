const https = require("node:https");

/**
 * 
 * @param {string} url 
 * @param {https.RequestOptions} options 
 * @param {(err: Error | null, res: import("node:http").IncomingMessage, body: Buffer) => void} callback 
 */
module.exports = function request(url, options, callback) {
  https.get(url, options, (res) => {
    /** @type {Buffer[]} */
    const chunks = [];
    
    res.on("data", chunk => { chunks.push(chunk); });
    res.on("end", () => {
      const size = chunks.reduce((pre, current) => current.length + pre, 0);
      const data = Buffer.concat(chunks, size);
      callback(null, res, data);
    });
    res.on("error", (err) => callback(err));
  });
}