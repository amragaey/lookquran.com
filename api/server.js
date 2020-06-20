const { EOL } = require("os");
const { promisify } = require("util");
const { exec } = require("child_process");
const http = require("http");
const https = require("https");
const url = require("url");
const surahs = require("./quran/surahs.json");
const surahLength = require("./quran/surahsLength.json");

const quranPath = "./quran/quran-simple.txt";
const quranNoTashkeelPath = "./quran/quran-simple-no-tashkeel.txt";
const tafsirMuyassarPath = "./quran/ar.muyassar.txt";

const execAsync = promisify(exec);

const root = process.cwd();

let server = http.createServer(function (req, res) {
	if (/^\/(search)\?.*/.test(req.url)) return searchQuran(req, res);
	else if (/^\/(tafsir)\/[0-9]+\/[0-9]+$/.test(req.url)) return getTafsir(req, res);
	else if (/^\/(audio)\/[0-9]+\/[0-9]+$/.test(req.url)) return playQuran(req, res);
	else {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not found.");
	}
});

server.listen(8080);

// Utils
async function grep(s, page, perPage, cb) {
	page -= 1;
	const $grep = `grep -n '${s}' ${quranNoTashkeelPath} | cut -d ':' -f 1 | sed 's/$/p/'`;
	let { stdout: lineNumbers } = await execAsync($grep, {
		cwd: root,
		maxBuffer: 1024 * 1024 * 2,
		encoding: "utf-8",
	});
	let totalItems = lineNumbers.split(EOL);
	totalItems.pop();
	let totalCount = totalItems.length;
	let currentItems = totalItems.slice(page * perPage, page * perPage + perPage).join(EOL);

	return getLinesFromFile(currentItems, quranPath, (err, data) => {
		if (err) {
			return cb(err, null);
		} else {
			return cb(null, data, totalCount);
		}
	});
}

function getLinesFromFile(lines, file, cb) {
	const $sed = `sed -n -e "${lines}" ${file}`;
	exec(
		$sed,
		{
			cwd: root,
			maxBuffer: 1024 * 1024 * 2,
		},
		function (err, stdout, stderr) {
			if (err) {
				return cb(err, null);
			} else {
				let resultArray = stdout.split(EOL);
				resultArray.pop();
				return cb(null, resultArray);
			}
		}
	);
}

function toArabicNumeral(en) {
	return ("" + en).replace(/[0-9]/g, function (t) {
		return "٠١٢٣٤٥٦٧٨٩".substr(+t, 1);
	});
}

function hasArabicCharacters(text) {
	return /[\u0600-\u06FF]+\s*$/.test(text);
}

function getAyahLine(surah, ayah) {
	surah = +surah;
	ayah = +ayah;
	let line = 0;
	for (let i = 0; i < surah - 1; i++) {
		line += surahLength[i];
	}
	line += ayah;
	return line;
}

// Controllers
function searchQuran(req, res) {
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json; charset=utf-8",
	});

	// console.time("search");
	let query = url.parse(req.url, true).query;
	if (query) {
		let { s, page, perPage } = query;

		page = +page || 1;
		perPage = +perPage || 30;

		let isArabic = hasArabicCharacters(s);

		if (!isArabic && s !== " " && s !== null) return res.end(JSON.stringify({ result: [], count: 0 }));

		s = s
			.replace(/['"]/g, "")
			.replace(/\p{Mn}/gsu, "")
			.replace(/[أإآى]/g, "ا");

		grep(s, page, perPage, function (err, results, totalCount) {
			if (err) {
				res.end(JSON.stringify({ err }));
			}

			resultsLength = results.length;
			output = [];

			for (let i = 0; i < resultsLength; i++) {
				let [surahNum, ayahNum, ayah] = results[i].split("|");
				let surah = surahs[+surahNum - 1];
				let path = `/${surahNum}/${ayahNum}`;
				if (ayah) {
					ayah = ayah.replace(new RegExp(s.split("").join("\\p{Mn}*").replace(/ا/g, "[اأآإى]"), "gu"), "<em>$&</em>");
				}
				let result = {
					text: ayah,
					ayah: `(${surah}:${toArabicNumeral(ayahNum)})`,
					path,
				};
				output.push(result);
			}

			res.end(JSON.stringify({ result: output, count: totalCount }));
		});
	} else {
		return res.end(JSON.stringify({ err }));
	}
	// console.timeEnd("search");
}

function playQuran(req, res) {
	let path = url.parse(req.url, true).path;
	let [_, __, surah, ayah] = path.split("/");
	let ayahLine = getAyahLine(surah, ayah);

	https.get("https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/" + ayahLine, function (res2) {
		delete res2.headers["set-cookie"];
		res.writeHead(200, res2.headers);
		return res2.pipe(res, { end: true });
	});
}

function getTafsir(req, res) {
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json; charset=utf-8",
	});

	let path = url.parse(req.url, true).path;
	let [_, __, surah, ayah] = path.split("/");
	let ayahLine = getAyahLine(surah, ayah);

	getLinesFromFile(ayahLine + "p", tafsirMuyassarPath, (err, data) => {
		if (err) {
			res.end(JSON.stringify({ err }));
		}
		let [_s, _a, tafsir] = data[0].split("|");
		let result = {
			text: "<strong>{ التفسير الميسر }</strong><br>" + tafsir,
		};
		res.end(JSON.stringify(result));
	});
}
