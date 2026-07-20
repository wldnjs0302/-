import { PREDEFINED_USERS } from './src/data/userMapping';

const url = "/leeyoonseop/1.png";
const isPredefined = PREDEFINED_USERS.some(u => {
        const folderNFC = u.folderName.normalize('NFC').toLowerCase();
        const nameNFC = u.name.normalize('NFC').toLowerCase();
        let decodedUrl = url;
        try {
          decodedUrl = decodeURIComponent(url);
        } catch (e) {}
        decodedUrl = decodedUrl.normalize('NFC').toLowerCase();
        return decodedUrl.includes(folderNFC) || decodedUrl.includes(nameNFC);
      });
console.log(isPredefined);
