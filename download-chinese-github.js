// Download Chinese Union Version (CUV) Bible from GitHub
// Similar approach to download-nabre.js

const fs = require('fs');
const https = require('https');

const GITHUB_URLS = [
    'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/cuv.json',
    'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Chinese%20Union%20Version.json',
    'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_cuv.json',
    'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/json/cuv.json'
];

function downloadBible(url, index = 0) {
    return new Promise((resolve, reject) => {
        console.log(`\n📥 Attempt ${index + 1}: Downloading from GitHub...`);
        console.log(`   ${url}\n`);
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        // Remove BOM if present
                        if (data.charCodeAt(0) === 0xFEFF) {
                            data = data.slice(1);
                        }
                        
                        const bibleJson = JSON.parse(data);
                        resolve(bibleJson);
                    } catch (error) {
                        console.log(`❌ Error parsing JSON: ${error.message}`);
                        if (index < GITHUB_URLS.length - 1) {
                            console.log(`   Trying next source...\n`);
                            downloadBible(GITHUB_URLS[index + 1], index + 1)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            reject(new Error('All download attempts failed'));
                        }
                    }
                } else {
                    console.log(`Status: ${res.statusCode}`);
                    if (index < GITHUB_URLS.length - 1) {
                        console.log(`❌ Failed (Status ${res.statusCode}), trying next source...\n`);
                        downloadBible(GITHUB_URLS[index + 1], index + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error(`Failed with status ${res.statusCode}`));
                    }
                }
            });
        }).on('error', (error) => {
            console.log(`❌ Network error: ${error.message}`);
            if (index < GITHUB_URLS.length - 1) {
                console.log(`   Trying next source...\n`);
                downloadBible(GITHUB_URLS[index + 1], index + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(error);
            }
        });
    });
}

function processBibleData(bibleJson) {
    const bibleData = {};
    
    // Handle different JSON structures
    let books = [];
    
    if (Array.isArray(bibleJson)) {
        books = bibleJson;
    } else if (bibleJson.books && Array.isArray(bibleJson.books)) {
        books = bibleJson.books;
    } else if (typeof bibleJson === 'object') {
        // Try to extract books from object
        books = Object.values(bibleJson).filter(item => 
            item && (item.book || item.name || item.book_name)
        );
    }
    
    console.log(`📚 Processing ${books.length} books...\n`);
    
    books.forEach((book, index) => {
        const bookName = book.book_name || book.name || book.book || `Book ${index + 1}`;
        bibleData[bookName] = {};
        
        // Handle different chapter structures
        let chapters = [];
        if (book.chapters && Array.isArray(book.chapters)) {
            chapters = book.chapters;
        } else if (Array.isArray(book)) {
            chapters = book;
        }
        
        chapters.forEach((chapter, chIndex) => {
            const chapterNum = (chIndex + 1).toString();
            bibleData[bookName][chapterNum] = {};
            
            // Handle different verse structures
            let verses = [];
            if (Array.isArray(chapter)) {
                verses = chapter;
            } else if (chapter.verses && Array.isArray(chapter.verses)) {
                verses = chapter.verses;
            } else if (typeof chapter === 'object') {
                verses = Object.entries(chapter).map(([verseNum, text]) => ({
                    verse: parseInt(verseNum),
                    text: text
                }));
            }
            
            verses.forEach((verse) => {
                const verseNum = (verse.verse || verse.verse_num || verse.v || 1).toString();
                const verseText = verse.text || verse.verse_text || verse.t || '';
                if (verseText) {
                    bibleData[bookName][chapterNum][verseNum] = verseText;
                }
            });
        });
        
        if (index % 10 === 0) {
            process.stdout.write(`  Processed ${index + 1}/${books.length} books...\r`);
        }
    });
    
    console.log(`\n✅ Processed all books!\n`);
    return bibleData;
}

// Main execution
console.log('🚀 Starting Chinese Union Version (CUV) download from GitHub...\n');

downloadBible(GITHUB_URLS[0])
    .then(bibleJson => {
        console.log('✅ Download successful! Processing data...\n');
        const bibleData = processBibleData(bibleJson);
        
        // Write to file
        const fileContent = `// Complete Bible Data (Chinese Union Version - CUV)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from GitHub
// Generated automatically - do not edit manually

const bibleDataCUV = ${JSON.stringify(bibleData, null, 2)};

`;
        
        fs.writeFileSync('bible-data-cuv.js', fileContent);
        
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
        
        console.log(`\n✅ Successfully processed Chinese Union Version!`);
        console.log(`📚 Books: ${bookNames.length}`);
        console.log(`📑 Chapters: ${totalChapters}`);
        console.log(`📝 Verses: ${totalVerses}`);
        console.log(`\n✨ Saved to bible-data-cuv.js!`);
    })
    .catch(error => {
        console.error(`\n❌ Failed to download Chinese Bible: ${error.message}`);
        console.log('\n💡 Alternative: The bible-api.com does not support CUV.');
        console.log('   You may need to find another source or manually add the data.');
        process.exit(1);
    });
