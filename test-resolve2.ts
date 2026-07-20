import { PREDEFINED_USERS } from './src/data/userMapping';

const src = "http://localhost:3000/leeyoonseop/1.png";
const isPredefined = PREDEFINED_USERS.some(u => {
    const folderNFC = u.folderName.normalize('NFC').toLowerCase();
    const nameNFC = u.name.normalize('NFC').toLowerCase();
    let decodedSrc = src;
    try {
      decodedSrc = decodeURIComponent(src);
    } catch (err) {}
    decodedSrc = decodedSrc.normalize('NFC').toLowerCase();
    return decodedSrc.includes(folderNFC) || decodedSrc.includes(nameNFC);
});

console.log("isPredefined for " + src + ": " + isPredefined);
