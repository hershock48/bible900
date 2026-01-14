// Improved Bible Fetch Script - Option 2: Alternative approach
// This script tries to fetch entire books at once when possible
// Run with: node fetch-bible-v2.js

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

// Number of chapters per book
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

// Try fetching entire book first, fall back to chapters
function fetchBook(bookName) {
    return new Promise((resolve, reject) => {
        const encodedBook = encodeURIComponent(bookName);
        // Try fetching entire book
        const url = `https://bible-api.com/${encodedBook}?translation=kjv`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200 && !data.includes('Retry later')) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('Book fetch failed or rate limited'));
                }
            });
        }).on('error', reject);
    });
}

// Fetch individual chapter with retries
function fetchChapter(bookName, chapterNum, retries = 5) {
    return new Promise((resolve, reject) => {
        const encodedBook = encodeURIComponent(bookName);
        const url = `https://bible-api.com/${encodedBook} ${chapterNum}?translation=kjv`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (data.includes('Retry later') || res.statusCode === 429) {
                    if (retries > 0) {
                        const waitTime = Math.pow(2, 6 - retries) * 3000; // Longer waits: 3s, 6s, 12s, 24s, 48s
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
                
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
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
                const waitTime = Math.pow(2, 6 - retries) * 2000;
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

// Organize verses by chapter
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

// Main fetch function
async function fetchAllBooks() {
    // Load existing data to preserve what we have
    let bibleData = {};
    try {
        const existing = fs.readFileSync('bible-data.js', 'utf8');
        const match = existing.match(/const bibleData = ({[\s\S]*});/);
        if (match) {
            bibleData = eval('(' + match[1] + ')');
            console.log('Loaded existing data:', Object.keys(bibleData).length, 'books');
        }
    } catch (e) {
        console.log('No existing data found, starting fresh');
    }
    
    console.log('\n🚀 Starting Bible fetch with improved approach...\n');
    console.log('This will take 1-2 hours. Progress will be saved periodically.\n');
    
    for (let i = 0; i < books.length; i++) {
        const bookName = books[i];
        const numChapters = bookChapters[bookName] || 1;
        
        // Skip if book already has all chapters
        if (bibleData[bookName]) {
            const existingChapters = Object.keys(bibleData[bookName]);
            if (existingChapters.length >= numChapters) {
                console.log(`⏭️  Skipping ${bookName} - already complete (${existingChapters.length}/${numChapters} chapters)`);
                continue;
            }
        }
        
        console.log(`\n📖 Fetching ${bookName} (${i + 1}/${books.length}) - ${numChapters} chapters...`);
        bibleData[bookName] = bibleData[bookName] || {};
        
        // First, try to fetch entire book
        let bookFetched = false;
        try {
            console.log(`  Trying to fetch entire ${bookName}...`);
            const bookData = await fetchBook(bookName);
            if (bookData.verses && Array.isArray(bookData.verses) && bookData.verses.length > 0) {
                const organized = organizeByChapter(bookData.verses);
                Object.keys(organized).forEach(ch => {
                    bibleData[bookName][ch] = organized[ch];
                });
                console.log(`  ✅ Fetched entire ${bookName} in one request!`);
                bookFetched = true;
                
                // Save progress
                saveProgress(bibleData);
                
                // Wait before next book
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log(`  ⚠️  Could not fetch entire book, will fetch chapter by chapter`);
        }
        
        // If entire book fetch failed, fetch chapter by chapter
        if (!bookFetched) {
            for (let chapter = 1; chapter <= numChapters; chapter++) {
                const chapterStr = chapter.toString();
                
                // Skip if chapter already exists
                if (bibleData[bookName][chapterStr]) {
                    process.stdout.write(`  ✓ Chapter ${chapter} (cached) `);
                    continue;
                }
                
                try {
                    const chapterData = await fetchChapter(bookName, chapter);
                    
                    if (chapterData.verses && Array.isArray(chapterData.verses)) {
                        const organized = organizeByChapter(chapterData.verses);
                        if (organized[chapterStr]) {
                            bibleData[bookName][chapterStr] = organized[chapterStr];
                            process.stdout.write(`  ✓ Chapter ${chapter} `);
                        } else {
                            process.stdout.write(`  ✗ Chapter ${chapter} (no data) `);
                        }
                    } else {
                        process.stdout.write(`  ✗ Chapter ${chapter} (no verses) `);
                    }
                    
                    // Save progress every 5 chapters
                    if (chapter % 5 === 0) {
                        saveProgress(bibleData);
                    }
                    
                    // Longer delay between chapters (2 seconds)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    process.stdout.write(`  ✗ Chapter ${chapter} (${error.message.substring(0, 20)}) `);
                    // Wait longer on error
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        
        console.log(`\n  ✅ Completed ${bookName}`);
        saveProgress(bibleData);
    }
    
    // Final save
    saveProgress(bibleData);
    console.log('\n\n🎉 Bible data fetch complete!');
    console.log(`Total books: ${Object.keys(bibleData).length}`);
}

// Save progress to file
function saveProgress(bibleData) {
    const fileContent = `// Complete Bible Data (KJV)
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Generated automatically - do not edit manually

const bibleData = ${JSON.stringify(bibleData, null, 2)};

`;
    
    fs.writeFileSync('bible-data.js', fileContent);
}

// Run the script
fetchAllBooks().catch(console.error);
