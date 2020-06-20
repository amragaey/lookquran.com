const fs = require("fs");

let quranFileNoTashkeel = fs.createWriteStream("./quran-simple-no-tashkeel.txt");

let quranFile = fs.readFileSync("./quran-simple.txt", "utf-8");

/**
 * Arabic tashkeel characters are considered 'Mark, Nonspacing' => Mn
 * Match unicode in regex https://javascript.info/regexp-unicode
 */
let quranFileWithoutTashkeel = quranFile
	.replace(/بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ /gu, "")
	.replace(/\p{Mn}/gu, "")
	.replace(/أ|إ|آ|ى/gu, "ا")
	.trim();

quranFileNoTashkeel.write(quranFileWithoutTashkeel);
