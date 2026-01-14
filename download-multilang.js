// Download Multiple Language Bibles from bible-api.com
// This script downloads popular language translations

const fs = require('fs');
const https = require('https');

// Popular languages and their translation codes on bible-api.com
const LANGUAGES = {
    'en': {
        name: 'English',
        translations: {
            'kjv': 'King James Version',
            'asv': 'American Standard Version',
            'web': 'World English Bible',
            'darby': 'Darby Bible',
            'dra': 'Douay-Rheims'
        }
    },
    'zh': {
        name: 'Chinese',
        translations: {
            'cuv': 'Chinese Union Version'
        }
    },
    'pt': {
        name: 'Portuguese',
        translations: {
            'almeida': 'João Ferreira de Almeida'
        }
    },
    'ru': {
        name: 'Russian',
        translations: {
            'synodal': 'Russian Synodal Translation'
        }
    },
    'ro': {
        name: 'Romanian',
        translations: {
            'rccv': 'Protestant Romanian Corrected Cornilescu Version'
        }
    },
    'cs': {
        name: 'Czech',
        translations: {
            'bkr': 'Bible kralická'
        }
    }
};

// Bible books in order
const books = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John",
    "3 John", "Jude", "Revelation"
];

const bookChapters = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
    "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
    "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52, "Lamentations": 5,
    "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9,
    "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
    "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
    "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
    "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
    "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
    "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1,
    "3 John": 1, "Jude": 1, "Revelation": 22
};

function fetchChapter(bookName, chapterNum, translation, retries = 3) {
    return new Promise((resolve, reject) => {
        const encodedBook = encodeURIComponent(bookName);
        const url = `https://bible-api.com/${encodedBook} ${chapterNum}?translation=${translation}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        if (retries > 0 && data.includes('Retry later')) {
                            setTimeout(() => {
                                fetchChapter(bookName, chapterNum, translation, retries - 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 2000);
                        } else {
                            reject(new Error(`Parse error: ${error.message}`));
                        }
                    }
                } else if (res.statusCode === 429 && retries > 0) {
                    setTimeout(() => {
                        fetchChapter(bookName, chapterNum, translation, retries - 1)
                            .then(resolve)
                            .catch(reject);
                    }, 3000);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
                }
            });
        }).on('error', (error) => {
            if (retries > 0) {
                setTimeout(() => {
                    fetchChapter(bookName, chapterNum, translation, retries - 1)
                        .then(resolve)
                        .catch(reject);
                }, 2000);
            } else {
                reject(error);
            }
        });
    });
}

function organizeByChapter(verses) {
    const organized = {};
    verses.forEach(verse => {
        const chapter = verse.chapter || 1;
        if (!organized[chapter]) {
            organized[chapter] = {};
        }
        organized[chapter][verse.verse] = verse.text || '';
    });
    return organized;
}

async function fetchBible(translation, translationName) {
    const bibleData = {};
    
    console.log(`\n📥 Fetching ${translationName} (${translation})...`);
    console.log('⚠️  This will take 30-60+ minutes due to API rate limits.\n');
    
    for (let i = 0; i < books.length; i++) {
        const bookName = books[i];
        const numChapters = bookChapters[bookName] || 1;
        
        console.log(`\n📖 ${bookName} (${i + 1}/${books.length}) - ${numChapters} chapters...`);
        bibleData[bookName] = {};
        
        for (let chapter = 1; chapter <= numChapters; chapter++) {
            try {
                const chapterData = await fetchChapter(bookName, chapter, translation);
                
                if (chapterData.verses && Array.isArray(chapterData.verses)) {
                    const organized = organizeByChapter(chapterData.verses);
                    if (organized[chapter]) {
                        bibleData[bookName][chapter] = organized[chapter];
                        process.stdout.write(`  ✓ ${chapter} `);
                    } else {
                        process.stdout.write(`  ✗ ${chapter} `);
                    }
                } else {
                    process.stdout.write(`  ✗ ${chapter} `);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                process.stdout.write(`  ✗ ${chapter} `);
            }
        }
        
        console.log(`\n  ✅ Completed ${bookName}`);
    }
    
    // Write to file
    const fileName = `bible-data-${translation}.js`;
    const varName = `bibleData${translation.toUpperCase()}`;
    const fileContent = `// Complete Bible Data (${translationName})
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Fetched from bible-api.com
// Generated automatically - do not edit manually

const ${varName} = ${JSON.stringify(bibleData, null, 2)};

`;
    
    fs.writeFileSync(fileName, fileContent);
    
    // Count stats
    const bookNames = Object.keys(bibleData);
    let totalChapters = 0;
    let totalVerses = 0;
    
    bookNames.forEach(book => {
        const chapters = Object.keys(bibleData[book]);
        totalChapters += chapters.length;
        chapters.forEach(ch => {
            totalVerses += Object.keys(bibleData[book][ch]).length;
        });
    });
    
    console.log(`\n✅ Successfully fetched ${translationName}!`);
    console.log(`📚 Books: ${bookNames.length}`);
    console.log(`📑 Chapters: ${totalChapters}`);
    console.log(`📝 Verses: ${totalVerses}`);
    console.log(`\n✨ Saved to ${fileName}!`);
}

// Get language and translation from command line
const args = process.argv.slice(2);
const langCode = args[0] || 'en';
const translationCode = args[1] || 'kjv';

if (LANGUAGES[langCode] && LANGUAGES[langCode].translations[translationCode]) {
    const translationName = LANGUAGES[langCode].translations[translationCode];
    fetchBible(translationCode, translationName).catch(console.error);
} else {
    console.log('Usage: node download-multilang.js [langCode] [translationCode]');
    console.log('\nAvailable languages:');
    Object.keys(LANGUAGES).forEach(lang => {
        console.log(`\n${LANGUAGES[lang].name} (${lang}):`);
        Object.keys(LANGUAGES[lang].translations).forEach(trans => {
            console.log(`  ${trans}: ${LANGUAGES[lang].translations[trans]}`);
        });
    });
}
