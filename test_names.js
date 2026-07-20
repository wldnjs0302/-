const normName = "이윤섭";
const predefinedUser = null; // or undefined
const normNameNFD = "이윤섭".normalize("NFD").trim();

const isLeeYoonSeopName = (predefinedUser && predefinedUser.folderName === "leeyoonseop") || normName === "이윤섭" || normNameNFD === "이윤섭".normalize("NFD") || normName.toLowerCase() === "leeyoonseop" || normName.toLowerCase() === "lee yoonseop" || normName.replace(/\s+/g, "") === "이윤섭" || normName === "이윤서" || normNameNFD === "이윤서".normalize("NFD") || normName.toLowerCase() === "leeyoonseo" || normName.replace(/\s+/g, "") === "이윤서";

console.log(isLeeYoonSeopName);
