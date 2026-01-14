// Download ESV Bible Script
// Downloads complete ESV Bible from public sources

const fs = require('fs');
const https = require('https');

// Try multiple possible URLs for ESV
const POSSIBLE_URLS = [
    'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_esv.json',
    'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/esv.json'
];

function downloadBible(url, index = 0) {
    if (index >= POSSIBLE_URLS.length) {
        console.error('❌ All download attempts failed.');
        return;
    }
    
    const currentUrl = POSSIBLE_URLS[index];
    console.log(`\n📥 Attempt ${index + 1}: Trying ${currentUrl}...\n`);
    
    https.get(currentUrl, (res) => {
        let data = '';
        
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
            res.on('data', (chunk) => {
                data += chunk;
                process.stdout.write(`\rDownloaded: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
            });
            
            res.on('end', () => {
                console.log('\n\n📖 Processing ESV Bible data...');
                
                try {
                    // Remove BOM (Byte Order Mark) if present
                    if (data.charCodeAt(0) === 0xFEFF) {
                        data = data.slice(1);
                    }
                    // Remove any leading whitespace
                    data = data.trim();
                    
                    const bibleJson = JSON.parse(data);
                    processBibleData(bibleJson);
                } catch (error) {
                    console.error('\n❌ Error parsing JSON:', error.message);
                    console.error('First 100 chars:', data.substring(0, 100));
                    // Try next URL
                    if (index + 1 < POSSIBLE_URLS.length) {
                        downloadBible(null, index + 1);
                    } else {
                        console.error('\n❌ All sources failed.');
                    }
                }
            });
        } else {
            console.log(`❌ Failed (Status ${res.statusCode}), trying next source...`);
            downloadBible(null, index + 1);
        }
    }).on('error', (error) => {
        console.error(`❌ Network error: ${error.message}`);
        downloadBible(null, index + 1);
    });
}

function processBibleData(bibleJson) {
    const bibleData = {};
    
    // Try different JSON structures
    let books = [];
    
    if (bibleJson.books && Array.isArray(bibleJson.books)) {
        books = bibleJson.books;
    } else if (Array.isArray(bibleJson)) {
        books = bibleJson;
    } else if (bibleJson.esv && bibleJson.esv.books) {
        books = bibleJson.esv.books;
    } else {
        console.error('❌ Unknown JSON structure');
        console.log('Available keys:', Object.keys(bibleJson));
        return;
    }
    
    books.forEach(book => {
        const bookName = book.name || book.book || book.book_name;
        if (!bookName) return;
        
        bibleData[bookName] = {};
        
        const chapters = book.chapters || [];
        
        // Check if chapters is array of arrays (thiagobodruk format: [[verse1, verse2, ...], [verse1, verse2, ...], ...])
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
    
    // Write to file
    const fileContent = `// Complete Bible Data (ESV)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from public GitHub repository
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

// Start download
console.log('🚀 Starting ESV Bible download...');
downloadBible();
