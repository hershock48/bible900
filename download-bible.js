// Download complete Bible from GitHub and convert to our format
// This is much faster than API fetching - downloads complete Bible in seconds!

const fs = require('fs');
const https = require('https');

// Using jburson/bible-data repository which has KJV in JSON format
const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/jburson/bible-data/master/kjv.json';

console.log('📥 Downloading complete KJV Bible from GitHub...\n');

https.get(BIBLE_JSON_URL, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
        console.error('Failed to download Bible data');
        return;
    }
    
    res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write(`\rDownloaded: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    });
    
    res.on('end', () => {
        console.log('\n\n📖 Processing Bible data...');
        
        try {
            const bibleJson = JSON.parse(data);
            
            // Convert to our format: bibleData[bookName][chapterNumber][verseNumber] = verse text
            const bibleData = {};
            
            // The structure from jburson/bible-data is: { books: [{ name, chapters: [{ number, verses: [{ number, text }] }] }] }
            if (bibleJson.books && Array.isArray(bibleJson.books)) {
                bibleJson.books.forEach(book => {
                    const bookName = book.name;
                    bibleData[bookName] = {};
                    
                    if (book.chapters && Array.isArray(book.chapters)) {
                        book.chapters.forEach(chapter => {
                            const chapterNum = chapter.number.toString();
                            bibleData[bookName][chapterNum] = {};
                            
                            if (chapter.verses && Array.isArray(chapter.verses)) {
                                chapter.verses.forEach(verse => {
                                    const verseNum = verse.number.toString();
                                    bibleData[bookName][chapterNum][verseNum] = verse.text || '';
                                });
                            }
                        });
                    }
                });
            } else {
                console.error('Unexpected JSON structure');
                return;
            }
            
            // Write to file
            const fileContent = `// Complete Bible Data (KJV)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from: https://github.com/jburson/bible-data
// Generated automatically - do not edit manually

const bibleData = ${JSON.stringify(bibleData, null, 2)};

`;
            
            fs.writeFileSync('bible-data.js', fileContent);
            
            // Count stats
            const books = Object.keys(bibleData);
            let totalChapters = 0;
            let totalVerses = 0;
            
            books.forEach(book => {
                const chapters = Object.keys(bibleData[book]);
                totalChapters += chapters.length;
                chapters.forEach(ch => {
                    totalVerses += Object.keys(bibleData[book][ch]).length;
                });
            });
            
            console.log('\n✅ Successfully downloaded and converted Bible!');
            console.log(`📚 Books: ${books.length}`);
            console.log(`📑 Chapters: ${totalChapters}`);
            console.log(`📝 Verses: ${totalVerses}`);
            console.log('\n✨ Your Bible Speed Reader now has the complete Bible!');
            
        } catch (error) {
            console.error('\n❌ Error processing Bible data:', error.message);
        }
    });
    
}).on('error', (error) => {
    console.error('❌ Download error:', error.message);
});
