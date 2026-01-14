// Download ESV Bible from GitHub
// This is much faster than API fetching

const fs = require('fs');
const https = require('https');

const ESV_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_esv.json';

console.log('📥 Downloading ESV (English Standard Version) from GitHub...\n');

https.get(ESV_JSON_URL, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
        console.error('❌ Failed to download ESV data');
        console.error(`Status: ${res.statusCode}`);
        console.log('\n⚠️  Falling back to API method. Run: node fetch-esv-api.js');
        return;
    }
    
    res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write(`\rDownloaded: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    });
    
    res.on('end', () => {
        console.log('\n\n📖 Processing ESV data...');
        
        try {
            // Remove BOM if present
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }
            data = data.trim();
            
            const bibleJson = JSON.parse(data);
            processBibleData(bibleJson);
        } catch (error) {
            console.error('\n❌ Error parsing JSON:', error.message);
            console.error('First 200 chars:', data.substring(0, 200));
        }
    });
}).on('error', (error) => {
    console.error(`❌ Network error: ${error.message}`);
    console.log('\n⚠️  Try using the API method instead: node fetch-esv-api.js');
});

function processBibleData(bibleJson) {
    const bibleData = {};
    
    // ESV structure: [{ name, chapters: [[verse1, verse2, ...], [verse1, verse2, ...], ...] }]
    if (Array.isArray(bibleJson)) {
        bibleJson.forEach(book => {
            const bookName = book.name || book.book || book.book_name;
            if (!bookName) return;
            
            bibleData[bookName] = {};
            
            const chapters = book.chapters || [];
            
            // Check if chapters is array of arrays (thiagobodruk format)
            if (chapters.length > 0 && Array.isArray(chapters[0]) && typeof chapters[0][0] === 'string') {
                // Format: chapters = [[verse1, verse2, ...], [verse1, verse2, ...], ...]
                chapters.forEach((chapterVerses, chapterIndex) => {
                    const chapterNum = (chapterIndex + 1).toString();
                    bibleData[bookName][chapterNum] = {};
                    
                    if (Array.isArray(chapterVerses)) {
                        chapterVerses.forEach((verseText, verseIndex) => {
                            const verseNum = (verseIndex + 1).toString();
                            bibleData[bookName][chapterNum][verseNum] = verseText || '';
                        });
                    }
                });
            } else {
                // Format: chapters = [{ number, verses: [{ number, text }] }]
                chapters.forEach((chapter, chapterIndex) => {
                    const chapterNum = (chapter.number || chapter.chapter || chapter.chapter_number || chapterIndex + 1).toString();
                    bibleData[bookName][chapterNum] = {};
                    
                    const verses = chapter.verses || [];
                    verses.forEach((verse, verseIndex) => {
                        const verseNum = (verse.number || verse.verse || verse.verse_number || verseIndex + 1).toString();
                        const verseText = verse.text || verse.verse || '';
                        bibleData[bookName][chapterNum][verseNum] = verseText;
                    });
                });
            }
        });
    } else {
        console.error('❌ Unexpected JSON structure');
        console.log('Available keys:', Object.keys(bibleJson));
        return;
    }
    
    // Write to file
    const fileContent = `// Complete Bible Data (ESV - English Standard Version)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from: https://github.com/thiagobodruk/bible
// Generated automatically - do not edit manually

const bibleDataESV = ${JSON.stringify(bibleData, null, 2)};

`;
    
    fs.writeFileSync('bible-data-esv.js', fileContent);
    
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
    
    console.log('\n✅ Successfully downloaded and converted ESV Bible!');
    console.log(`📚 Books: ${bookNames.length}`);
    console.log(`📑 Chapters: ${totalChapters}`);
    console.log(`📝 Verses: ${totalVerses}`);
    console.log('\n✨ ESV Bible data saved to bible-data-esv.js!');
}
