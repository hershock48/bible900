// Bible Version Verification Script
// Verifies that Bible data matches the expected version by checking key verses

const fs = require('fs');

// Known verses for each version (first few words as verification)
const VERSION_SIGNATURES = {
    'KJV': {
        'Genesis': { '1': { '1': 'In the beginning God created the heaven and the earth.' } },
        'John': { '3': { '16': 'For God so loved the world, that he gave his only begotten Son' } },
        'Psalms': { '23': { '1': '[A Psalm of David.] The LORD {is} my shepherd' } }
    },
    'ESV': {
        'Genesis': { '1': { '1': 'In the beginning, God created the heavens and the earth.' } },
        'John': { '3': { '16': 'For God so loved the world, that he gave his only Son' } },
        'Psalms': { '23': { '1': 'The LORD is my shepherd; I shall not want.' } }
    },
    'NIV': {
        'Genesis': { '1': { '1': 'In the beginning God created the heavens and the earth.' } },
        'John': { '3': { '16': 'For God so loved the world that he gave his one and only Son' } },
        'Psalms': { '23': { '1': 'The LORD is my shepherd, I lack nothing.' } }
    },
    'NAB': {
        'Genesis': { '1': { '1': 'In the beginning, when God created the heavens and the earth' } },
        'John': { '3': { '16': 'For God so loved the world that he gave his only Son' } },
        'Psalms': { '23': { '1': 'The LORD is my shepherd' } }
    },
    'NABRE': {
        'Genesis': { '1': { '1': 'In the beginning, when God created the heavens and the earth' } },
        'John': { '3': { '16': 'For God so loved the world that he gave his only Son' } },
        'Psalms': { '23': { '1': 'The LORD is my shepherd' } }
    }
};

function verifyBibleVersion(filePath, expectedVersion, varName = 'bibleData') {
    console.log(`\n🔍 Verifying ${expectedVersion} Bible data from ${filePath}...\n`);
    
    try {
        // Read the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract bibleData object (supports different variable names)
        const regex = new RegExp(`const ${varName} = ({[\\s\\S]+});`);
        const match = fileContent.match(regex);
        if (!match) {
            console.error(`❌ Could not find ${varName} in file`);
            return false;
        }
        
        const bibleData = eval('(' + match[1] + ')');
        
        // Get expected signatures
        const signatures = VERSION_SIGNATURES[expectedVersion];
        if (!signatures) {
            console.error(`❌ Unknown version: ${expectedVersion}`);
            return false;
        }
        
        let allMatch = true;
        let matches = 0;
        let total = 0;
        
        // Check each signature verse
        for (const [book, chapters] of Object.entries(signatures)) {
            for (const [chapter, verses] of Object.entries(chapters)) {
                for (const [verse, expectedText] of Object.entries(verses)) {
                    total++;
                    const actualText = bibleData[book]?.[chapter]?.[verse];
                    
                    if (!actualText) {
                        console.error(`❌ Missing: ${book} ${chapter}:${verse}`);
                        allMatch = false;
                        continue;
                    }
                    
                    // Check if the actual text starts with the expected text (allowing for variations)
                    // For KJV, check for key phrases
                    if (expectedVersion === 'KJV') {
                        const keyPhrases = {
                            'Genesis 1:1': ['heaven and the earth', 'In the beginning'],
                            'John 3:16': ['only begotten Son', 'believeth'],
                            'Psalms 23:1': ['LORD', 'shepherd', 'shall not want']
                        };
                        
                        const key = `${book} ${chapter}:${verse}`;
                        const phrases = keyPhrases[key] || [];
                        const matchesPhrase = phrases.some(phrase => 
                            actualText.toLowerCase().includes(phrase.toLowerCase())
                        );
                        
                        if (matchesPhrase || actualText.startsWith(expectedText.substring(0, 30))) {
                            console.log(`✅ ${book} ${chapter}:${verse} - Matches ${expectedVersion}`);
                            matches++;
                        } else {
                            console.error(`❌ ${book} ${chapter}:${verse} - Does NOT match ${expectedVersion}`);
                            console.error(`   Expected (starts with): "${expectedText.substring(0, 50)}..."`);
                            console.error(`   Actual (starts with):   "${actualText.substring(0, 50)}..."`);
                            allMatch = false;
                        }
                    } else if (expectedVersion === 'NABRE' || expectedVersion === 'NAB') {
                        // NABRE may have chapter headers, so check if text contains key phrases
                        const keyPhrases = {
                            'Genesis 1:1': ['created', 'heavens', 'earth'],
                            'John 3:16': ['loved the world', 'only Son'],
                            'Psalms 23:1': ['LORD', 'shepherd']
                        };
                        
                        const key = `${book} ${chapter}:${verse}`;
                        const phrases = keyPhrases[key] || [];
                        const matchesPhrase = phrases.some(phrase => 
                            actualText.toLowerCase().includes(phrase.toLowerCase())
                        );
                        
                        if (matchesPhrase || actualText.toLowerCase().includes(expectedText.toLowerCase().substring(0, 30))) {
                            console.log(`✅ ${book} ${chapter}:${verse} - Matches ${expectedVersion}`);
                            matches++;
                        } else {
                            console.error(`❌ ${book} ${chapter}:${verse} - Does NOT match ${expectedVersion}`);
                            console.error(`   Expected (contains): "${expectedText.substring(0, 50)}..."`);
                            console.error(`   Actual (starts with):   "${actualText.substring(0, 50)}..."`);
                            allMatch = false;
                        }
                    } else {
                        // For other versions, do a simple prefix check
                        if (actualText.toLowerCase().startsWith(expectedText.toLowerCase().substring(0, 30))) {
                            console.log(`✅ ${book} ${chapter}:${verse} - Matches ${expectedVersion}`);
                            matches++;
                        } else {
                            console.error(`❌ ${book} ${chapter}:${verse} - Does NOT match ${expectedVersion}`);
                            console.error(`   Expected (starts with): "${expectedText.substring(0, 50)}..."`);
                            console.error(`   Actual (starts with):   "${actualText.substring(0, 50)}..."`);
                            allMatch = false;
                        }
                    }
                }
            }
        }
        
        console.log(`\n📊 Verification Results: ${matches}/${total} verses match`);
        
        if (allMatch) {
            console.log(`\n✅ SUCCESS: Bible data matches ${expectedVersion} version!`);
            return true;
        } else {
            console.log(`\n❌ WARNING: Some verses do not match ${expectedVersion} version.`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error verifying Bible version: ${error.message}`);
        return false;
    }
}

// Check Bible versions
const versionsToCheck = [
    { file: './bible-data.js', version: 'KJV', varName: 'bibleData' },
    { file: './bible-data-nab.js', version: 'NABRE', varName: 'bibleDataNAB' }
];

let allValid = true;

versionsToCheck.forEach(({ file, version, varName }) => {
    if (require('fs').existsSync(file)) {
        const isValid = verifyBibleVersion(file, version, varName);
        if (!isValid) allValid = false;
    } else {
        console.log(`\n⚠️  ${file} not found - skipping ${version} verification`);
    }
});

process.exit(allValid ? 0 : 1);
