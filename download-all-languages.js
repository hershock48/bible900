// Download All Multi-Language Bibles from GitHub
// Path of least resistance: Use GitHub repos that have the data

const fs = require('fs');
const https = require('https');

// Language configurations with multiple GitHub source URLs
const LANGUAGES = {
    'zh': {
        name: 'Chinese',
        translation: 'CUV',
        varName: 'bibleDataCUV',
        fileName: 'bible-data-cuv.js',
        urls: [
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/zh_cuv.json',
            'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/cuv.json',
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Chinese%20Union%20Version.json'
        ]
    },
    'pt': {
        name: 'Portuguese',
        translation: 'ALMEIDA',
        varName: 'bibleDataALMEIDA',
        fileName: 'bible-data-almeida.js',
        urls: [
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json', // Almeida Corrigida Fiel
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_aa.json',  // Almeida Atualizada
            'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/almeida.json',
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Portuguese%20Almeida.json'
        ]
    },
    'ru': {
        name: 'Russian',
        translation: 'SYNODAL',
        varName: 'bibleDataSYNODAL',
        fileName: 'bible-data-synodal.js',
        urls: [
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ru_synodal.json',
            'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/synodal.json',
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Russian%20Synodal.json'
        ]
    },
    'ro': {
        name: 'Romanian',
        translation: 'RCCV',
        varName: 'bibleDataRCCV',
        fileName: 'bible-data-rccv.js',
        urls: [
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ro_cornilescu.json', // Cornilescu version
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ro_rccv.json',
            'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/rccv.json',
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Romanian%20RCCV.json'
        ]
    },
    'cs': {
        name: 'Czech',
        translation: 'BKR',
        varName: 'bibleDataBKR',
        fileName: 'bible-data-bkr.js',
        urls: [
            'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/cs_bkr.json',
            'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/cross_references/json/bkr.json',
            'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/JSON/Czech%20BKR.json'
        ]
    }
};

function downloadBible(url, langConfig, urlIndex = 0) {
    return new Promise((resolve, reject) => {
        if (urlIndex >= langConfig.urls.length) {
            reject(new Error(`All sources failed for ${langConfig.name}`));
            return;
        }
        
        const currentUrl = langConfig.urls[urlIndex];
        console.log(`\n📥 Attempt ${urlIndex + 1}/${langConfig.urls.length}: ${langConfig.name}`);
        console.log(`   ${currentUrl}\n`);
        
        https.get(currentUrl, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
                process.stdout.write(`\r   Downloaded: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
            });
            
            res.on('end', () => {
                console.log('');
                
                if (res.statusCode === 200) {
                    try {
                        // Remove BOM if present
                        if (data.charCodeAt(0) === 0xFEFF) {
                            data = data.slice(1);
                        }
                        data = data.trim();
                        
                        const bibleJson = JSON.parse(data);
                        resolve(bibleJson);
                    } catch (error) {
                        console.log(`❌ Parse error: ${error.message.substring(0, 50)}`);
                        if (urlIndex + 1 < langConfig.urls.length) {
                            downloadBible(null, langConfig, urlIndex + 1)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            reject(error);
                        }
                    }
                } else {
                    console.log(`❌ Status ${res.statusCode}`);
                    if (urlIndex + 1 < langConfig.urls.length) {
                        downloadBible(null, langConfig, urlIndex + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                }
            });
        }).on('error', (error) => {
            console.log(`❌ Network error: ${error.message}`);
            if (urlIndex + 1 < langConfig.urls.length) {
                downloadBible(null, langConfig, urlIndex + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(error);
            }
        });
    });
}

function processBibleData(bibleJson, langConfig) {
    const bibleData = {};
    
    // Handle different JSON structures (same as download-bible-alt.js)
    let books = [];
    
    if (Array.isArray(bibleJson)) {
        books = bibleJson;
    } else if (bibleJson.books && Array.isArray(bibleJson.books)) {
        books = bibleJson.books;
    } else if (typeof bibleJson === 'object') {
        books = Object.values(bibleJson).filter(item => 
            item && (item.book || item.name || item.book_name)
        );
    }
    
    console.log(`   📚 Processing ${books.length} books...`);
    
    books.forEach((book, index) => {
        // Handle thiagobodruk format: {abbrev: "gn", chapters: [["verse1", "verse2"], ["verse1"]]}
        const bookName = book.book_name || book.name || book.book || 
                        (book.abbrev ? getBookNameFromAbbrev(book.abbrev) : `Book ${index + 1}`);
        bibleData[bookName] = {};
        
        let chapters = [];
        if (book.chapters && Array.isArray(book.chapters)) {
            chapters = book.chapters;
        } else if (Array.isArray(book)) {
            chapters = book;
        }
        
        chapters.forEach((chapter, chIndex) => {
            const chapterNum = (chIndex + 1).toString();
            bibleData[bookName][chapterNum] = {};
            
            // Handle thiagobodruk format: chapter is array of verse strings
            if (Array.isArray(chapter)) {
                chapter.forEach((verseText, verseIndex) => {
                    if (verseText && typeof verseText === 'string') {
                        const verseNum = (verseIndex + 1).toString();
                        bibleData[bookName][chapterNum][verseNum] = verseText;
                    }
                });
            } else {
                // Handle other formats
                let verses = [];
                if (chapter.verses && Array.isArray(chapter.verses)) {
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
            }
        });
        
        if ((index + 1) % 10 === 0) {
            process.stdout.write(`\r   Processed ${index + 1}/${books.length} books...`);
        }
    });
    
    console.log(`\r   ✅ Processed all ${books.length} books!`);
    return bibleData;
}

async function downloadLanguage(langCode) {
    const langConfig = LANGUAGES[langCode];
    if (!langConfig) {
        console.error(`Unknown language: ${langCode}`);
        return;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌍 Downloading ${langConfig.name} (${langConfig.translation})`);
    console.log(`${'='.repeat(60)}`);
    
    try {
        const bibleJson = await downloadBible(null, langConfig);
        const bibleData = processBibleData(bibleJson, langConfig);
        
        // Write to file
        const fileContent = `// Complete Bible Data (${langConfig.name} - ${langConfig.translation})
// Format: bibleData[bookName][chapterNumber][verseNumber] = verse text
// Downloaded from GitHub
// Generated automatically - do not edit manually

const ${langConfig.varName} = ${JSON.stringify(bibleData, null, 2)};

`;
        
        fs.writeFileSync(langConfig.fileName, fileContent);
        
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
        
        console.log(`\n✅ Successfully downloaded ${langConfig.name}!`);
        console.log(`   📚 Books: ${bookNames.length}`);
        console.log(`   📑 Chapters: ${totalChapters}`);
        console.log(`   📝 Verses: ${totalVerses}`);
        console.log(`   ✨ Saved to ${langConfig.fileName}\n`);
        
        return true;
    } catch (error) {
        console.error(`\n❌ Failed to download ${langConfig.name}: ${error.message}\n`);
        return false;
    }
}

// Main execution
async function main() {
    const languages = process.argv.slice(2);
    const langsToDownload = languages.length > 0 ? languages : Object.keys(LANGUAGES);
    
    console.log('🚀 Starting multi-language Bible downloads from GitHub...\n');
    console.log(`📥 Languages to download: ${langsToDownload.join(', ')}\n`);
    
    const results = {};
    for (const langCode of langsToDownload) {
        results[langCode] = await downloadLanguage(langCode);
        // Small delay between languages
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Download Summary');
    console.log('='.repeat(60));
    Object.entries(results).forEach(([lang, success]) => {
        const langName = LANGUAGES[lang].name;
        console.log(`   ${success ? '✅' : '❌'} ${langName}: ${success ? 'Success' : 'Failed'}`);
    });
    console.log('');
}

main().catch(console.error);
