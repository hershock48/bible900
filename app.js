// RSVP Speed Reader Application
class BibleSpeedReader {
    constructor() {
        this.currentWords = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.timeoutId = null;
        this.currentSpeed = 300;
        this.currentBook = null;
        this.currentChapter = null;
        this.currentVersion = 'KJV';
        this.allBooks = [];
        this.bibleData = {}; // Will hold the current version's data
        
        this.initializeElements();
        this.loadBibleVersion();
        this.populateBooks();
        this.attachEventListeners();
    }
    
    initializeElements() {
        this.versionSelect = document.getElementById('version-select');
        this.bookSelect = document.getElementById('book-select');
        this.chapterSelect = document.getElementById('chapter-select');
        this.speedSelect = document.getElementById('speed-select');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.wordDisplay = document.getElementById('word');
        this.readerContainer = document.getElementById('reader-container');
        this.progressText = document.getElementById('progress-text');
        this.currentLocation = document.getElementById('current-location');
        this.availableBooksInfo = document.getElementById('available-books-info');
        
        // Initially disable start button
        this.startBtn.disabled = true;
    }
    
    // Load Bible data for the selected version
    loadBibleVersion() {
        const version = this.versionSelect ? this.versionSelect.value : 'KJV';
        this.currentVersion = version;
        
        // For now, we only have KJV data loaded
        // When more versions are added, we can load them here
        if (typeof bibleData !== 'undefined') {
            this.bibleData = bibleData; // Current KJV data
        } else {
            console.error('Bible data not loaded!');
            this.bibleData = {};
        }
        
        // Show which books have data
        this.showAvailableBooks();
    }
    
    showAvailableBooks() {
        const booksWithData = [];
        Object.keys(this.bibleData).forEach(bookName => {
            const chapters = this.bibleData[bookName] ? Object.keys(this.bibleData[bookName]) : [];
            if (chapters.length > 0) {
                booksWithData.push(bookName);
            }
        });
        
        if (booksWithData.length > 0) {
            this.availableBooksInfo.textContent = `${this.currentVersion} - Available books: ${booksWithData.join(', ')}`;
            this.availableBooksInfo.style.display = 'block';
        } else {
            this.availableBooksInfo.style.display = 'none';
        }
    }
    
    populateBooks() {
        // Clear existing options except the first one
        this.bookSelect.innerHTML = '<option value="">Select a book...</option>';
        
        // Store all books with data for auto-progression
        this.allBooks = [];
        
        // Add all books from current version's data, but mark which ones have chapters
        Object.keys(this.bibleData).forEach(bookName => {
            const option = document.createElement('option');
            option.value = bookName;
            
            // Check if book has any chapters
            const chapters = this.bibleData[bookName] ? Object.keys(this.bibleData[bookName]) : [];
            const hasChapters = chapters.length > 0;
            
            if (hasChapters) {
                option.textContent = `${bookName} (${chapters.length} chapters)`;
                this.allBooks.push(bookName);
            } else {
                option.textContent = `${bookName} (no data)`;
                option.disabled = true;
            }
            
            this.bookSelect.appendChild(option);
        });
    }
    
    attachEventListeners() {
        this.versionSelect.addEventListener('change', () => this.onVersionChange());
        this.bookSelect.addEventListener('change', () => this.onBookChange());
        this.chapterSelect.addEventListener('change', () => this.onChapterChange());
        this.speedSelect.addEventListener('change', () => this.onSpeedChange());
        this.startBtn.addEventListener('click', () => this.startReading());
        this.pauseBtn.addEventListener('click', () => this.pauseReading());
        this.stopBtn.addEventListener('click', () => this.stopReading());
    }
    
    onVersionChange() {
        // Stop reading if currently reading
        if (this.isPlaying) {
            this.stopReading();
        }
        
        // Load new version
        this.loadBibleVersion();
        
        // Repopulate books for new version
        this.populateBooks();
        
        // Clear chapter selection
        this.chapterSelect.innerHTML = '<option value="">Select a chapter...</option>';
        this.startBtn.disabled = true;
    }
    
    onSpeedChange() {
        // Update current speed immediately if reading is active
        if (this.isPlaying || this.currentWords.length > 0) {
            const newSpeed = parseInt(this.speedSelect.value);
            this.currentSpeed = newSpeed;
            console.log('Speed changed to:', newSpeed, 'WPM');
            // If currently playing, the next word will use the new speed
            // If paused, it will use the new speed when resumed
        }
    }
    
    onBookChange() {
        const bookName = this.bookSelect.value;
        console.log('Book selected:', bookName);
        this.chapterSelect.innerHTML = '<option value="">Select a chapter...</option>';
        this.startBtn.disabled = true; // Disable start button until chapter is selected
        
        if (!bookName) {
            return;
        }
        
        if (!this.bibleData[bookName]) {
            console.error('Book not found in bibleData:', bookName);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Book not found in data';
            option.disabled = true;
            this.chapterSelect.appendChild(option);
            return;
        }
        
        const chapters = Object.keys(this.bibleData[bookName]);
        console.log('Chapters found for', bookName, ':', chapters.length, chapters);
        
        if (chapters.length === 0) {
            // Show message if no chapters available
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No chapters available for this book';
            option.disabled = true;
            this.chapterSelect.appendChild(option);
        } else {
            // Sort chapters numerically
            chapters.sort((a, b) => parseInt(a) - parseInt(b));
            chapters.forEach(chapterNum => {
                const option = document.createElement('option');
                option.value = chapterNum;
                option.textContent = `Chapter ${chapterNum}`;
                this.chapterSelect.appendChild(option);
            });
            console.log('Added', chapters.length, 'chapters to dropdown');
        }
    }
    
    onChapterChange() {
        // Enable start button if both book and chapter are selected
        const book = this.bookSelect.value;
        const chapter = this.chapterSelect.value;
        this.startBtn.disabled = !(book && chapter);
    }
    
    prepareText() {
        const bookName = this.bookSelect.value;
        const chapterNum = this.chapterSelect.value;
        
        console.log('Preparing text for:', bookName, 'Chapter', chapterNum);
        
        if (!bookName || !chapterNum) {
            console.error('Missing book or chapter');
            alert('Please select both a book and a chapter.');
            return false;
        }
        
        if (!this.bibleData[bookName]) {
            console.error('Book not found:', bookName);
            alert(`Book "${bookName}" not found in Bible data.`);
            return false;
        }
        
        if (!this.bibleData[bookName][chapterNum]) {
            console.error('Chapter not found:', bookName, chapterNum);
            alert(`Chapter ${chapterNum} not found for ${bookName}.`);
            return false;
        }
        
        // Get the chapter text
        const chapter = this.bibleData[bookName][chapterNum];
        console.log('Chapter data:', Object.keys(chapter).length, 'verses');
        
        // Combine all verses into one text
        let fullText = '';
        Object.keys(chapter).sort((a, b) => parseInt(a) - parseInt(b)).forEach(verseNum => {
            const verseText = chapter[verseNum];
            if (verseText && typeof verseText === 'string') {
                // Clean up newlines and extra whitespace
                fullText += verseText.replace(/\n/g, ' ').trim() + ' ';
            }
        });
        
        console.log('Full text length:', fullText.length);
        
        // Split into words, clean up, and filter empty strings
        this.currentWords = fullText
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => {
                // Clean punctuation but preserve apostrophes and hyphens within words
                return word.replace(/[^\w\s'-]/g, '');
            })
            .filter(word => word.length > 0); // Filter out any empty strings after cleaning
        
        console.log('Total words:', this.currentWords.length);
        
        if (this.currentWords.length === 0) {
            alert('No text found for this chapter.');
            return false;
        }
        
        return true;
    }
    
    startReading() {
        // Store current book and chapter for auto-progression
        this.currentBook = this.bookSelect.value;
        this.currentChapter = this.chapterSelect.value;
        
        if (!this.prepareText()) {
            // prepareText already shows alerts, so just return
            return;
        }
        
        this.currentSpeed = parseInt(this.speedSelect.value);
        this.currentIndex = 0;
        this.isPlaying = true;
        
        // Show reader container and hide/show appropriate buttons
        this.readerContainer.style.display = 'flex';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.stopBtn.style.display = 'inline-block';
        
        // Disable book/chapter controls during reading, but allow speed changes
        this.bookSelect.disabled = true;
        this.chapterSelect.disabled = true;
        // Speed select stays enabled so user can change speed while paused
        
        this.displayNextWord();
    }
    
    // Get next chapter, or next book if no more chapters
    getNextChapter() {
        if (!this.currentBook || !this.currentChapter) {
            return null;
        }
        
        const currentChapterNum = parseInt(this.currentChapter);
        const bookData = bibleData[this.currentBook];
        
        if (!bookData) {
            return null;
        }
        
        // Check if there's a next chapter in the current book
        const nextChapterNum = currentChapterNum + 1;
        const nextChapterStr = nextChapterNum.toString();
        
        if (bookData[nextChapterStr]) {
            // Next chapter exists in current book
            return {
                book: this.currentBook,
                chapter: nextChapterStr
            };
        }
        
        // No more chapters in current book, find next book
        const currentBookIndex = this.allBooks.indexOf(this.currentBook);
        if (currentBookIndex >= 0 && currentBookIndex < this.allBooks.length - 1) {
            const nextBook = this.allBooks[currentBookIndex + 1];
            const nextBookData = this.bibleData[nextBook];
            
            if (nextBookData) {
                // Get first chapter of next book
                const chapters = Object.keys(nextBookData).sort((a, b) => parseInt(a) - parseInt(b));
                if (chapters.length > 0) {
                    return {
                        book: nextBook,
                        chapter: chapters[0]
                    };
                }
            }
        }
        
        // No more chapters or books
        return null;
    }
    
    // Automatically continue to next chapter
    continueToNextChapter() {
        const next = this.getNextChapter();
        
        if (!next) {
            // Finished entire Bible (or all available books)
            alert('Reading complete! You have finished all available chapters.');
            this.stopReading();
            return;
        }
        
        // Check if book changed
        const bookChanged = this.currentBook !== next.book;
        
        // Update to next chapter
        this.currentBook = next.book;
        this.currentChapter = next.chapter;
        
        // Update UI dropdowns (but keep them disabled)
        this.bookSelect.value = this.currentBook;
        
        // Update chapter dropdown options if book changed
        if (bookChanged) {
            this.onBookChange();
        }
        this.chapterSelect.value = this.currentChapter;
        
        // Prepare and continue reading
        if (this.prepareText()) {
            this.currentIndex = 0;
            // Small pause before next chapter (500ms transition)
            setTimeout(() => {
                if (this.isPlaying) {
                    this.displayNextWord();
                }
            }, 500);
        } else {
            // If next chapter failed to load, try next one
            console.warn('Failed to load chapter, trying next...');
            this.continueToNextChapter();
        }
    }
    
    // Calculate Optimal Recognition Point (ORP) - the letter to highlight in red
    getORPIndex(word) {
        if (word.length <= 1) return 0;
        if (word.length <= 3) return 1; // For short words, highlight 2nd letter
        // For longer words, highlight around 30-40% into the word
        return Math.floor(word.length * 0.35);
    }
    
    // Format word with red letter at ORP
    formatWordWithORP(word) {
        if (!word || word.length === 0) {
            console.warn('Empty word passed to formatWordWithORP');
            return word;
        }
        
        const orpIndex = this.getORPIndex(word);
        const before = word.substring(0, orpIndex);
        const letter = word[orpIndex];
        const after = word.substring(orpIndex + 1);
        
        if (!letter) {
            console.warn('No letter at ORP index', orpIndex, 'for word:', word);
            return word;
        }
        
        // Use inline styles to ensure the red letter is always visible
        const formatted = `${before}<span style="color: #ff0000 !important; font-weight: 800 !important; text-shadow: 0 0 15px rgba(255, 0, 0, 0.8), 0 0 30px rgba(255, 0, 0, 0.4); font-size: 1.1em;">${letter}</span>${after}`;
        return formatted;
    }
    
    displayNextWord() {
        if (!this.isPlaying) {
            return;
        }
        
        // Check if current chapter is finished
        if (this.currentIndex >= this.currentWords.length) {
            // Chapter finished - automatically continue to next chapter
            console.log('Chapter finished, continuing to next chapter...');
            this.continueToNextChapter();
            return;
        }
        
        const word = this.currentWords[this.currentIndex];
        
        // Create word with red letter using DOM elements instead of innerHTML
        this.wordDisplay.innerHTML = ''; // Clear first
        
        const orpIndex = this.getORPIndex(word);
        const before = word.substring(0, orpIndex);
        const letter = word[orpIndex];
        const after = word.substring(orpIndex + 1);
        
        // Create text nodes and span for red letter
        if (before) {
            this.wordDisplay.appendChild(document.createTextNode(before));
        }
        
        const redLetterSpan = document.createElement('span');
        redLetterSpan.textContent = letter;
        redLetterSpan.style.color = '#cc0000'; // Darker, more muted red
        redLetterSpan.style.fontWeight = '700'; // Slightly less bold
        redLetterSpan.style.textShadow = 'none'; // No glow at all
        redLetterSpan.style.fontSize = '1.05em'; // Slightly less prominent
        this.wordDisplay.appendChild(redLetterSpan);
        
        if (after) {
            this.wordDisplay.appendChild(document.createTextNode(after));
        }
        
        // Update progress and location
        this.progressText.textContent = `${this.currentIndex + 1} / ${this.currentWords.length} words`;
        if (this.currentBook && this.currentChapter) {
            this.currentLocation.textContent = `${this.currentBook} ${this.currentChapter}`;
        }
        
        // Calculate time per word in milliseconds
        const timePerWord = (60 * 1000) / this.currentSpeed;
        
        this.currentIndex++;
        
        // Schedule next word
        this.timeoutId = setTimeout(() => {
            this.displayNextWord();
        }, timePerWord);
    }
    
    pauseReading() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.pauseBtn.textContent = 'Pause';
            this.displayNextWord();
        } else {
            this.pauseBtn.textContent = 'Resume';
        }
    }
    
    stopReading() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        this.isPlaying = false;
        this.currentIndex = 0;
        this.currentWords = [];
        this.currentBook = null;
        this.currentChapter = null;
        
        // Hide reader container and reset buttons
        this.readerContainer.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.stopBtn.style.display = 'none';
        this.pauseBtn.textContent = 'Pause';
        
        // Re-enable controls
        this.bookSelect.disabled = false;
        this.chapterSelect.disabled = false;
        this.speedSelect.disabled = false;
        
        this.wordDisplay.textContent = '';
        this.progressText.textContent = '0 / 0 words';
        if (this.currentLocation) {
            this.currentLocation.textContent = '';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Debug: Check if bibleData is loaded
    if (typeof bibleData === 'undefined') {
        console.error('bibleData is not defined! Check if bible-data.js is loading correctly.');
        alert('Error: Bible data not loaded. Please check the console for details.');
        return;
    }
    
    console.log('Bible data loaded:', Object.keys(bibleData).length, 'books');
    console.log('Sample - Genesis chapters:', bibleData.Genesis ? Object.keys(bibleData.Genesis) : 'not found');
    
    try {
        new BibleSpeedReader();
    } catch (error) {
        console.error('Error initializing BibleSpeedReader:', error);
        alert('Error initializing app: ' + error.message);
    }
});
