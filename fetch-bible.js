// Script to fetch the complete Bible and populate bible-data.js
// Run this with Node.js: node fetch-bible.js
// This will fetch the KJV Bible from a public API and create the bible-data.js file

const fs = require('fs');
const https = require('https');

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

// Function to fetch a chapter from the API with retry logic
function fetchChapter(bookName, chapterNum, retries = 3) {
    return new Promise((resolve, reject) => {
        // Using bible-api.com - a free, public Bible API
        const encodedBook = encodeURIComponent(bookName);
        const url = `https://bible-api.com/${encodedBook} ${chapterNum}?translation=kjv`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // Check for rate limiting
                if (data.includes('Retry later') || res.statusCode === 429) {
                    if (retries > 0) {
                        // Wait longer before retrying (exponential backoff)
                        const waitTime = Math.pow(2, 4 - retries) * 2000; // 2s, 4s, 8s
                        setTimeout(() => {
                            fetchChapter(bookName, chapterNum, retries - 1)
                                .then(resolve)
                                .catch(reject);
                        }, waitTime);
                        return;
                    } else {
                        reject(new Error('Rate limited - no more retries'));
                        return;
                    }
                }
                
                // Check for other HTTP errors
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 50)}`));
                    return;
                }
                
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            if (retries > 0) {
                const waitTime = Math.pow(2, 4 - retries) * 1000;
                setTimeout(() => {
                    fetchChapter(bookName, chapterNum, retries - 1)
                        .then(resolve)
                        .catch(reject);
                }, waitTime);
            } else {
                reject(error);
            }
        });
    });
}

// Function to organize verses by chapter
function organizeByChapter(verses) {
    const chapters = {};
    
    if (!verses || !Array.isArray(verses)) {
        return chapters;
    }
    
    verses.forEach(verse => {
        const chapter = verse.chapter || verse.chapter_number || 1;
        const verseNum = verse.verse || verse.verse_number;
        const text = verse.text;
        
        if (!chapters[chapter]) {
            chapters[chapter] = {};
        }
        
        chapters[chapter][verseNum] = text;
    });
    
    return chapters;
}

// Get number of chapters for a book (approximate - you may need to adjust)
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

// Main function to fetch all books
async function fetchAllBooks() {
    const bibleData = {};
    
    console.log('Fetching Bible data... This may take 30-60 minutes.');
    console.log('Please be patient - fetching all 66 books with all chapters...\n');
    
    for (let i = 0; i < books.length; i++) {
        const bookName = books[i];
        const numChapters = bookChapters[bookName] || 1;
        
        console.log(`\nFetching ${bookName} (${i + 1}/${books.length}) - ${numChapters} chapters...`);
        bibleData[bookName] = {};
        
        for (let chapter = 1; chapter <= numChapters; chapter++) {
            try {
                const chapterData = await fetchChapter(bookName, chapter);
                
                if (chapterData.verses && Array.isArray(chapterData.verses)) {
                    const organized = organizeByChapter(chapterData.verses);
                    if (organized[chapter]) {
                        bibleData[bookName][chapter] = organized[chapter];
                        process.stdout.write(`  ✓ Chapter ${chapter} `);
                    } else {
                        process.stdout.write(`  ✗ Chapter ${chapter} (no data) `);
                    }
                } else {
                    process.stdout.write(`  ✗ Chapter ${chapter} (no verses) `);
                }
                
                // Add a longer delay to avoid overwhelming the API (1 second between requests)
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                process.stdout.write(`  ✗ Chapter ${chapter} (error: ${error.message}) `);
            }
        }
        
        console.log(`\n  Completed ${bookName}`);
    }
    
    // Write to file
    const fileContent = `// Complete Bible Data (KJV)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Generated automatically - do not edit manually

const bibleData = ${JSON.stringify(bibleData, null, 2)};

`;
    
    fs.writeFileSync('bible-data.js', fileContent);
    console.log('\n\n✅ Bible data successfully saved to bible-data.js');
    console.log(`Total books: ${Object.keys(bibleData).length}`);
    console.log('\nYou can now open index.html in your browser!');
}

// Run the script
fetchAllBooks().catch(console.error);
