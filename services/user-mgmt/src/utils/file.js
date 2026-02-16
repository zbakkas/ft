import crypto from 'crypto'
import fs from 'fs';

export const generateFilename = (ext = '') => {
    const timeStamp = Date.now()
    const randomName = crypto.randomBytes(8).toString('hex')
    return `${timeStamp}-${randomName}${ext ? ext : ''}`
}

export const saveFile = (stream, filePath) => {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}
