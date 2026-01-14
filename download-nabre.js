// Download NABRE (New American Bible Revised Edition) from GitHub
// This is much faster than API fetching

const fs = require('fs');
const https = require('https');

const NABRE_JSON_URL = 'https://raw.githubusercontent.com/nirmalben/bible-nabre-json-dataset/master/generated_data/nabre.json';

console.log('📥 Downloading NABRE (New American Bible Revised Edition) from GitHub...\n');

https.get(NABRE_JSON_URL, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
        console.error('❌ Failed to download NABRE data');
        console.error(`Status: ${res.statusCode}`);
        return;
    }
    
    res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write(`\rDownloaded: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    });
    
    res.on('end', () => {
        console.log('\n\n📖 Processing NABRE data...');
        
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
});

function processBibleData(bibleJson) {
    const bibleData = {};
    
    // NABRE structure: [{ book: "Genesis", chapters: [{ chapter: 1, verses: [{ verse: 1, text: "..." }] }] }]
    if (Array.isArray(bibleJson)) {
        bibleJson.forEach(book => {
            const bookName = book.book || book.name;
            if (!bookName) return;
            
            bibleData[bookName] = {};
            
            const chapters = book.chapters || [];
            chapters.forEach(chapter => {
                const chapterNum = (chapter.chapter || chapter.number || 1).toString();
                bibleData[bookName][chapterNum] = {};
                
                const verses = chapter.verses || [];
                verses.forEach(verse => {
                    const verseNum = (verse.verse || verse.number || 1).toString();
                    const verseText = verse.text || '';
                    bibleData[bookName][chapterNum][verseNum] = verseText;
                });
            });
        });
    } else {
        console.error('❌ Unexpected JSON structure');
        console.log('Available keys:', Object.keys(bibleJson));
        return;
    }
    
    // Write to file
    const fileContent = `// Complete Bible Data (NABRE - New American Bible Revised Edition)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from: https://github.com/nirmalben/bible-nabre-json-dataset
// Includes deuterocanonical books (Tobit, Judith, Wisdom, Sirach, Baruch, 1-2 Maccabees)
// Generated automatically - do not edit manually

const bibleDataNAB = ${JSON.stringify(bibleData, null, 2)};

`;
    
    fs.writeFileSync('bible-data-nab.js', fileContent);
    
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
    
    console.log('\n✅ Successfully downloaded and converted NABRE!');
    console.log(`📚 Books: ${bookNames.length}`);
    console.log(`📑 Chapters: ${totalChapters}`);
    console.log(`📝 Verses: ${totalVerses}`);
    
    // Check for deuterocanonical books
    const deuterocanonical = ['Tobit', 'Judith', 'Wisdom', 'Sirach', 'Baruch', '1 Maccabees', '2 Maccabees'];
    const found = bookNames.filter(book => deuterocanonical.includes(book));
    if (found.length > 0) {
        console.log(`\n📖 Deuterocanonical books found: ${found.join(', ')}`);
    }
    
    console.log('\n✨ NABRE Bible data saved to bible-data-nab.js!');
}
