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
        this.currentVersion = 'NABRE';
        this.currentLanguage = 'en';
        this.allBooks = [];
        this.bibleData = {}; // Will hold the current version's data
        
        // Reading statistics
        this.stats = {
            totalWordsRead: 0,
            totalTimeSpent: 0, // in seconds
            chaptersCompleted: 0,
            startTime: null,
            sessionStartTime: null
        };
        
        this.initializeElements();
        this.updateVersionOptions('en'); // Initialize with English versions
        this.loadBibleVersion();
        this.populateBooks();
        this.loadStatistics();
        this.loadLastPosition();
        this.loadDarkMode();
        this.loadPreferences(); // Load after dark mode so font size applies correctly
        this.attachEventListeners();
        this.setupKeyboardShortcuts();
        
        // Set mobile default font size
        this.setMobileDefaults();
    }
    
    setMobileDefaults() {
        if (window.innerWidth <= 768) {
            // On mobile, default to small if no preference saved
            const savedFontSize = localStorage.getItem('bibleReader_fontSize');
            if (!savedFontSize && this.fontSizeSelect) {
                this.fontSizeSelect.value = '3.5';
                this.onFontSizeChange();
            }
        }
    }
    
    loadDarkMode() {
        const isDark = localStorage.getItem('bibleReader_darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (this.darkModeToggle) {
                this.darkModeToggle.textContent = '☀️';
            }
        }
    }
    
    loadPreferences() {
        // Check if mobile
        const isMobile = window.innerWidth <= 768;
        
        // Load font size preference, or default to small on mobile
        const savedFontSize = localStorage.getItem('bibleReader_fontSize');
        if (savedFontSize && this.fontSizeSelect) {
            this.fontSizeSelect.value = savedFontSize;
        } else if (isMobile && this.fontSizeSelect) {
            // Default to small on mobile
            this.fontSizeSelect.value = '3.5';
        }
        
        if (this.fontSizeSelect) {
            this.onFontSizeChange();
        }
    }
    
    initializeElements() {
        this.languageSelect = document.getElementById('language-select');
        this.versionSelect = document.getElementById('version-select');
        this.bookSelect = document.getElementById('book-select');
        this.chapterSelect = document.getElementById('chapter-select');
        this.speedSelect = document.getElementById('speed-select');
        this.speedSelectReading = document.getElementById('speed-select-reading');
        this.fontSizeSelect = document.getElementById('font-size-select');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.pauseBtnDesktop = document.getElementById('pause-btn-desktop');
        this.stopBtnDesktop = document.getElementById('stop-btn-desktop');
        this.wordDisplay = document.getElementById('word');
        this.readerContainer = document.getElementById('reader-container');
        this.progressText = document.getElementById('progress-text');
        this.currentLocation = document.getElementById('current-location');
        this.progressBar = document.getElementById('progress-bar');
        this.statsBar = document.getElementById('stats-bar');
        this.statsDisplay = document.getElementById('stats-display');
        this.continueReadingBtn = document.getElementById('continue-reading-btn');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.currentSpeedIndicator = document.getElementById('current-speed-indicator');
        this.mobilePauseBtn = document.getElementById('mobile-pause-btn');
        this.mobileStopBtn = document.getElementById('mobile-stop-btn');
        this.focusModeToggle = document.getElementById('focus-mode-toggle');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.searchResults = document.getElementById('search-results');
        this.readingPlanSelect = document.getElementById('reading-plan-select');
        this.readingPlanGroup = document.getElementById('reading-plan-group');
        
        // Initially disable start button
        this.startBtn.disabled = true;
        
        // Set up mobile controls
        if (this.mobilePauseBtn) {
            this.mobilePauseBtn.addEventListener('click', () => this.pauseReading());
        }
        if (this.mobileStopBtn) {
            this.mobileStopBtn.addEventListener('click', () => this.stopReading());
        }
        
        // Set up continue reading button
        if (this.continueReadingBtn) {
            this.continueReadingBtn.addEventListener('click', () => this.resumeFromLastPosition());
        }
        
        // Set up dark mode toggle
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
    }
    
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('bibleReader_darkMode', isDark);
        
        // Update button icon
        if (this.darkModeToggle) {
            this.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
        }
    }
    
    // Load Bible data for the selected version
    onLanguageChange() {
        // Stop reading if currently reading
        if (this.isPlaying) {
            this.stopReading();
        }
        
        const language = this.languageSelect ? this.languageSelect.value : 'en';
        this.updateVersionOptions(language);
        this.loadBibleVersion();
        this.populateBooks();
        this.chapterSelect.innerHTML = '<option value="">Select a chapter...</option>';
        this.startBtn.disabled = true;
        
        // Show message if no data is available
        if (Object.keys(this.bibleData).length === 0) {
            const languageNames = {
                'en': 'English',
                'zh': 'Chinese',
                'pt': 'Portuguese',
                'ru': 'Russian',
                'ro': 'Romanian',
                'cs': 'Czech'
            };
            
            // Special message for Chinese - API doesn't support it
            if (language === 'zh') {
                alert(`Chinese Bible data is not available yet.\n\nThe bible-api.com service doesn't support Chinese Union Version (CUV).\n\nWe're working on finding an alternative source.\n\nPlease use English (KJV or NABRE) for now.`);
            } else {
                alert(`Bible data for ${languageNames[language] || language} is not yet available. Please use English (KJV or NABRE) for now.`);
            }
            
            // Reset to English
            this.languageSelect.value = 'en';
            this.updateVersionOptions('en');
            this.loadBibleVersion();
            this.populateBooks();
        }
    }
    
    updateVersionOptions(language) {
        if (!this.versionSelect) return;
        
        // Clear existing options
        this.versionSelect.innerHTML = '';
        
        // Define available versions per language
        const languageVersions = {
            'en': [
                { value: 'NABRE', text: 'NABRE (New American Bible Revised Edition)', available: typeof bibleDataNAB !== 'undefined' },
                { value: 'KJV', text: 'KJV (King James Version)', available: typeof bibleData !== 'undefined' },
                { value: 'ASV', text: 'ASV (American Standard Version)', available: typeof bibleDataASV !== 'undefined' },
                { value: 'WEB', text: 'WEB (World English Bible)', available: typeof bibleDataWEB !== 'undefined' },
                { value: 'ESV', text: 'ESV (English Standard Version)', available: typeof bibleDataESV !== 'undefined', disabled: true }
            ],
            'zh': [
                { value: 'CUV', text: 'Chinese Union Version (中文和合本)', available: typeof bibleDataCUV !== 'undefined', disabled: typeof bibleDataCUV === 'undefined' }
            ],
            'pt': [
                { value: 'ALMEIDA', text: 'João Ferreira de Almeida (Português)', available: typeof bibleDataALMEIDA !== 'undefined', disabled: typeof bibleDataALMEIDA === 'undefined' }
            ],
            'ru': [
                { value: 'SYNODAL', text: 'Russian Synodal Translation (Синодальный перевод)', available: typeof bibleDataSYNODAL !== 'undefined', disabled: typeof bibleDataSYNODAL === 'undefined' }
            ],
            'ro': [
                { value: 'RCCV', text: 'Protestant Romanian Corrected Cornilescu Version (Română)', available: typeof bibleDataRCCV !== 'undefined', disabled: typeof bibleDataRCCV === 'undefined' }
            ],
            'cs': [
                { value: 'BKR', text: 'Bible kralická (Čeština)', available: typeof bibleDataBKR !== 'undefined', disabled: typeof bibleDataBKR === 'undefined' }
            ]
        };
        
        const versions = languageVersions[language] || languageVersions['en'];
        let hasSelected = false;
        
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.value;
            option.textContent = version.text;
            if (version.disabled || !version.available) {
                option.disabled = true;
                if (!version.available) {
                    option.textContent += ' - Not Available';
                }
            }
            if (!hasSelected && version.available && !version.disabled) {
                option.selected = true;
                hasSelected = true;
            }
            this.versionSelect.appendChild(option);
        });
    }
    
    loadBibleVersion() {
        const language = this.languageSelect ? this.languageSelect.value : 'en';
        const version = this.versionSelect ? this.versionSelect.value : 'NABRE';
        this.currentVersion = version;
        this.currentLanguage = language;
        
        // Load the appropriate Bible version data based on language and version
        if (language === 'en') {
            if (version === 'NABRE') {
                if (typeof bibleDataNAB !== 'undefined') {
                    this.bibleData = bibleDataNAB;
                } else {
                    console.error('NABRE Bible data not loaded!');
                    this.bibleData = {};
                }
            } else if (version === 'KJV') {
                if (typeof bibleData !== 'undefined') {
                    this.bibleData = bibleData;
                } else {
                    console.error('KJV Bible data not loaded!');
                    this.bibleData = {};
                }
            } else if (version === 'ASV') {
                if (typeof bibleDataASV !== 'undefined') {
                    this.bibleData = bibleDataASV;
                } else {
                    console.error('ASV Bible data not loaded!');
                    this.bibleData = {};
                }
            } else if (version === 'WEB') {
                if (typeof bibleDataWEB !== 'undefined') {
                    this.bibleData = bibleDataWEB;
                } else {
                    console.error('WEB Bible data not loaded!');
                    this.bibleData = {};
                }
            } else if (version === 'ESV') {
                if (typeof bibleDataESV !== 'undefined') {
                    this.bibleData = bibleDataESV;
                } else {
                    console.error('ESV Bible data not loaded!');
                    this.bibleData = {};
                }
            }
        } else if (language === 'zh' && version === 'CUV') {
            if (typeof bibleDataCUV !== 'undefined') {
                this.bibleData = bibleDataCUV;
            } else {
                console.error('Chinese Union Version not loaded!');
                this.bibleData = {};
            }
        } else if (language === 'pt' && version === 'ALMEIDA') {
            if (typeof bibleDataALMEIDA !== 'undefined') {
                this.bibleData = bibleDataALMEIDA;
            } else {
                console.error('Almeida Portuguese not loaded!');
                this.bibleData = {};
            }
        } else if (language === 'ru' && version === 'SYNODAL') {
            if (typeof bibleDataSYNODAL !== 'undefined') {
                this.bibleData = bibleDataSYNODAL;
            } else {
                console.error('Russian Synodal not loaded!');
                this.bibleData = {};
            }
        } else if (language === 'ro' && version === 'RCCV') {
            if (typeof bibleDataRCCV !== 'undefined') {
                this.bibleData = bibleDataRCCV;
            } else {
                console.error('Romanian RCCV not loaded!');
                this.bibleData = {};
            }
        } else if (language === 'cs' && version === 'BKR') {
            if (typeof bibleDataBKR !== 'undefined') {
                this.bibleData = bibleDataBKR;
            } else {
                console.error('Czech Bible kralická not loaded!');
                this.bibleData = {};
            }
        } else {
            console.error(`Unknown language/version combination: ${language}/${version}`);
            this.bibleData = {};
        }
        
        // Books are now available via the dropdown
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
        this.languageSelect.addEventListener('change', () => this.onLanguageChange());
        this.versionSelect.addEventListener('change', () => this.onVersionChange());
        this.bookSelect.addEventListener('change', () => this.onBookChange());
        this.chapterSelect.addEventListener('change', () => this.onChapterChange());
        this.speedSelect.addEventListener('change', () => this.onSpeedChange());
        this.fontSizeSelect.addEventListener('change', () => this.onFontSizeChange());
        this.startBtn.addEventListener('click', () => this.startReading());
        this.pauseBtn.addEventListener('click', () => this.pauseReading());
        this.stopBtn.addEventListener('click', () => this.stopReading());
        if (this.pauseBtnDesktop) {
            this.pauseBtnDesktop.addEventListener('click', () => this.pauseReading());
        }
        if (this.stopBtnDesktop) {
            this.stopBtnDesktop.addEventListener('click', () => this.stopReading());
        }
        if (this.focusModeToggle) {
            this.focusModeToggle.addEventListener('click', () => this.toggleFocusMode());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        if (this.readingPlanSelect) {
            this.readingPlanSelect.addEventListener('change', () => this.onReadingPlanChange());
        }
    }
    
    onFontSizeChange() {
        const fontSize = this.fontSizeSelect.value + 'rem';
        if (this.wordDisplay) {
            this.wordDisplay.style.fontSize = fontSize;
        }
        // Save preference
        localStorage.setItem('bibleReader_fontSize', this.fontSizeSelect.value);
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case ' ': // Spacebar - Pause/Resume
                    e.preventDefault();
                    if (this.isPlaying || (this.currentWords.length > 0 && !this.isPlaying)) {
                        this.pauseReading();
                    }
                    break;
                case 'ArrowUp': // Increase speed
                    e.preventDefault();
                    this.adjustSpeed(100);
                    break;
                case 'ArrowDown': // Decrease speed
                    e.preventDefault();
                    this.adjustSpeed(-100);
                    break;
                case 'ArrowLeft': // Decrease speed by 50
                    e.preventDefault();
                    this.adjustSpeed(-50);
                    break;
                case 'ArrowRight': // Increase speed by 50
                    e.preventDefault();
                    this.adjustSpeed(50);
                    break;
                case 'Escape': // Stop reading
                    e.preventDefault();
                    if (this.isPlaying || this.currentWords.length > 0) {
                        this.stopReading();
                    }
                    break;
            }
        });
    }
    
    // Adjust speed using keyboard
    adjustSpeed(change) {
        const speeds = [300, 400, 500, 600, 700, 800, 900];
        const currentIndex = speeds.indexOf(this.currentSpeed);
        let newIndex = currentIndex;
        
        if (change > 0) {
            newIndex = Math.min(speeds.length - 1, currentIndex + Math.ceil(change / 100));
        } else {
            newIndex = Math.max(0, currentIndex + Math.floor(change / 100));
        }
        
        const newSpeed = speeds[newIndex];
        if (newSpeed !== this.currentSpeed) {
            this.speedSelect.value = newSpeed;
            this.onSpeedChange();
        }
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
        // Sync reading speed select with main speed select
        const newSpeed = parseInt(this.speedSelect.value);
        if (this.speedSelectReading) {
            this.speedSelectReading.value = newSpeed;
        }
        
        // Update current speed immediately if reading is active or paused
        if (this.isPlaying || this.currentWords.length > 0) {
            this.currentSpeed = newSpeed;
            console.log('Speed changed to:', newSpeed, 'WPM');
            // If currently playing, the next word will use the new speed
            // If paused, it will use the new speed when resumed
        }
        this.updateSpeedIndicator();
    }
    
    updateSpeedIndicator() {
        if (this.currentSpeedIndicator) {
            if (this.isPlaying || this.currentWords.length > 0) {
                this.currentSpeedIndicator.textContent = `⚡ ${this.currentSpeed} WPM`;
                this.currentSpeedIndicator.style.display = 'inline-block';
            } else {
                this.currentSpeedIndicator.style.display = 'none';
            }
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
        // Use current book/chapter if set (for resume), otherwise use select values
        const bookName = this.currentBook || this.bookSelect.value;
        const chapterNum = this.currentChapter || this.chapterSelect.value;
        
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
        // For non-ASCII languages (Chinese, Russian, etc.), preserve all characters
        // For ASCII languages, clean punctuation but preserve apostrophes and hyphens
        this.currentWords = fullText
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => {
                // Check if word contains non-ASCII characters (Chinese, Russian, etc.)
                const hasNonASCII = /[^\x00-\x7F]/.test(word);
                if (hasNonASCII) {
                    // For non-ASCII languages, preserve all characters (just trim)
                    return word.trim();
                } else {
                    // For ASCII languages, clean punctuation but preserve apostrophes and hyphens
                    return word.replace(/[^\w\s'-]/g, '');
                }
            })
            .filter(word => word.length > 0); // Filter out any empty strings after cleaning
        
        console.log('Total words:', this.currentWords.length);
        
        if (this.currentWords.length === 0) {
            alert('No text found for this chapter.');
            return false;
        }
        
        return true;
    }
    
    startReading(resumeFromSaved = false) {
        // Prevent multiple reading sessions from starting
        if (this.isPlaying) {
            console.warn('Already reading! Ignoring start request.');
            return;
        }
        
        // Clear any existing timeouts/intervals to prevent duplicates
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
            this.statsUpdateInterval = null;
        }
        
        // Store current book and chapter for auto-progression
        if (!resumeFromSaved) {
            this.currentBook = this.bookSelect.value;
            this.currentChapter = this.chapterSelect.value;
            this.currentIndex = 0;
        }
        
        if (!this.prepareText()) {
            // prepareText already shows alerts, so just return
            return;
        }
        
        // If resuming, make sure we don't go past the end
        if (resumeFromSaved && this.currentIndex >= this.currentWords.length) {
            this.currentIndex = 0;
        }
        
        this.currentSpeed = parseInt(this.speedSelect.value);
        this.isPlaying = true;
        
        // Reset chapter tracking
        this.wordsCountedThisChapter = 0;
        this.chapterCounted = false;
        
        // Start tracking time
        this.stats.sessionStartTime = Date.now();
        if (!this.stats.startTime) {
            this.stats.startTime = Date.now();
        }
        
        // Save current position
        this.saveLastPosition();
        
        // Hide continue reading button
        if (this.continueReadingBtn) {
            this.continueReadingBtn.style.display = 'none';
        }
        
        // Hide controls panel on mobile when reading starts
        const controlsPanel = document.querySelector('.controls');
        if (controlsPanel) {
            controlsPanel.style.display = 'none';
        }
        
        // Show reader container and hide/show appropriate buttons
        this.readerContainer.style.display = 'flex';
        this.readerContainer.classList.add('active');
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.stopBtn.style.display = 'inline-block';
        
        // Show desktop controls in reader container (only on desktop)
        const desktopControlsTop = document.getElementById('desktop-controls-top');
        const mobileControlsTop = document.getElementById('mobile-controls-top');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Show mobile controls on mobile
            if (mobileControlsTop) {
                mobileControlsTop.style.display = 'flex';
            }
            if (this.mobilePauseBtn) {
                this.mobilePauseBtn.style.display = 'flex';
                this.mobilePauseBtn.textContent = 'Pause';
            }
            if (this.mobileStopBtn) {
                this.mobileStopBtn.style.display = 'flex';
            }
            // Hide desktop controls on mobile
            if (desktopControlsTop) {
                desktopControlsTop.style.display = 'none';
            }
        } else {
            // Show desktop controls on desktop
            if (desktopControlsTop) {
                desktopControlsTop.style.display = 'flex';
            }
            if (this.pauseBtnDesktop) {
                this.pauseBtnDesktop.style.display = 'inline-block';
                this.pauseBtnDesktop.textContent = 'Pause';
            }
            if (this.stopBtnDesktop) {
                this.stopBtnDesktop.style.display = 'inline-block';
            }
            // Hide mobile controls on desktop
            if (mobileControlsTop) {
                mobileControlsTop.style.display = 'none';
            }
        }
        
        // Disable book/chapter controls during reading, but allow speed changes
        this.bookSelect.disabled = true;
        this.chapterSelect.disabled = true;
        // Speed select stays enabled so user can change speed while paused
        
        // Show reading speed control and sync it
        const readingControls = document.getElementById('reading-controls');
        if (readingControls) {
            readingControls.style.display = 'flex';
        }
        if (this.speedSelectReading) {
            this.speedSelectReading.value = this.currentSpeed;
            this.speedSelectReading.disabled = false;
        }
        
        // Update stats display
        this.updateStatsDisplay();
        this.updateSpeedIndicator();
        
        // Set up periodic stats updates while reading
        this.startStatsUpdateInterval();
        
        // Smooth transition
        this.readerContainer.style.opacity = '0';
        setTimeout(() => {
            this.readerContainer.style.transition = 'opacity 0.5s ease';
            this.readerContainer.style.opacity = '1';
        }, 10);
        
        this.displayNextWord();
    }
    
    startStatsUpdateInterval() {
        // Clear any existing interval
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        
        // Update stats display every second while reading
        this.statsUpdateInterval = setInterval(() => {
            if (this.isPlaying) {
                this.updateStatsDisplay();
            } else {
                clearInterval(this.statsUpdateInterval);
            }
        }, 1000);
    }
    
    // Get next chapter, or next book if no more chapters
    getNextChapter() {
        if (!this.currentBook || !this.currentChapter) {
            return null;
        }
        
        const currentChapterNum = parseInt(this.currentChapter);
        const bookData = this.bibleData[this.currentBook];
        
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
        
        // Reset chapter tracking for new chapter
        this.wordsCountedThisChapter = 0;
        this.chapterCounted = false;
        
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
            
            // Smooth transition to next chapter
            this.readerContainer.style.opacity = '0.7';
            
            // Small pause before next chapter (500ms transition)
            setTimeout(() => {
                if (this.isPlaying) {
                    this.readerContainer.style.transition = 'opacity 0.5s ease';
                    this.readerContainer.style.opacity = '1';
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
        // Double-check we're still playing (guard against multiple instances)
        if (!this.isPlaying) {
            return;
        }
        
        // Check if current chapter is finished
        if (this.currentIndex >= this.currentWords.length) {
            // Mark chapter as counted
            this.chapterCounted = true;
            
            // Final update statistics
            this.updateStatistics(true);
            
            // Celebrate chapter completion
            this.celebrateChapterCompletion();
            
            // Chapter finished - automatically continue to next chapter
            console.log('Chapter finished, continuing to next chapter...');
            setTimeout(() => {
                this.continueToNextChapter();
            }, 1500); // Give time for celebration
            return;
        }
        
        // Safety check: make sure we have words to display
        if (!this.currentWords || this.currentWords.length === 0) {
            console.error('No words to display!');
            this.stopReading();
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
        const progressPercent = this.currentWords.length > 0 
            ? ((this.currentIndex + 1) / this.currentWords.length) * 100 
            : 0;
        
        this.progressText.textContent = `${this.currentIndex + 1} / ${this.currentWords.length} words`;
        if (this.currentBook && this.currentChapter) {
            this.currentLocation.textContent = `${this.currentBook} ${this.currentChapter}`;
        }
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${progressPercent}%`;
        }
        
        // Update statistics every word (for real-time word counting)
        this.updateStatistics();
        
        // Save position and update display periodically (every 10 words)
        if (this.currentIndex % 10 === 0) {
            this.saveLastPosition();
            this.saveStatistics();
            this.updateStatsDisplay();
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
        
        // Update statistics when pausing
        if (this.isPlaying && this.stats.sessionStartTime) {
            const sessionTime = (Date.now() - this.stats.sessionStartTime) / 1000;
            this.stats.totalTimeSpent += sessionTime;
            this.stats.sessionStartTime = null;
        }
        
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.pauseBtn.textContent = 'Pause';
            if (this.pauseBtnDesktop) {
                this.pauseBtnDesktop.textContent = 'Pause';
            }
            if (this.mobilePauseBtn) {
                this.mobilePauseBtn.textContent = 'Pause';
            }
            // Resume tracking time
            this.stats.sessionStartTime = Date.now();
            this.displayNextWord();
        } else {
            this.pauseBtn.textContent = 'Resume';
            if (this.pauseBtnDesktop) {
                this.pauseBtnDesktop.textContent = 'Resume';
            }
            if (this.mobilePauseBtn) {
                this.mobilePauseBtn.textContent = 'Resume';
            }
            // Save position when pausing
            this.saveLastPosition();
            this.saveStatistics();
            this.updateStatsDisplay();
        }
    }
    
    stopReading() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        // Update statistics before stopping
        this.updateStatistics();
        
        // Save position before stopping
        this.saveLastPosition();
        
        this.isPlaying = false;
        this.currentIndex = 0;
        this.currentWords = [];
        this.currentBook = null;
        this.currentChapter = null;
        this.stats.sessionStartTime = null;
        
        // Clear stats update interval
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
            this.statsUpdateInterval = null;
        }
        
        // Hide reader container and reset buttons
        this.readerContainer.style.display = 'none';
        this.readerContainer.classList.remove('active');
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.stopBtn.style.display = 'none';
        this.pauseBtn.textContent = 'Pause';
        
        // Hide desktop controls
        const desktopControlsTop = document.getElementById('desktop-controls-top');
        if (desktopControlsTop) {
            desktopControlsTop.style.display = 'none';
        }
        if (this.pauseBtnDesktop) {
            this.pauseBtnDesktop.style.display = 'none';
            this.pauseBtnDesktop.textContent = 'Pause';
        }
        if (this.stopBtnDesktop) {
            this.stopBtnDesktop.style.display = 'none';
        }
        
        // Hide mobile controls
        if (this.mobilePauseBtn) {
            this.mobilePauseBtn.style.display = 'none';
        }
        if (this.mobileStopBtn) {
            this.mobileStopBtn.style.display = 'none';
        }
        
        // Show controls panel again on mobile
        const controlsPanel = document.querySelector('.controls');
        if (controlsPanel) {
            controlsPanel.style.display = 'flex';
        }
        
        // Re-enable controls
        this.bookSelect.disabled = false;
        this.chapterSelect.disabled = false;
        this.speedSelect.disabled = false;
        
        // Re-enable continue reading button if there's a saved position
        if (this.continueReadingBtn) {
            this.continueReadingBtn.disabled = false;
            // Check if we should show it
            const saved = localStorage.getItem('bibleReader_lastPosition');
            if (saved) {
                try {
                    const lastPosition = JSON.parse(saved);
                    const daysSince = (Date.now() - lastPosition.timestamp) / (1000 * 60 * 60 * 24);
                    if (daysSince < 30) {
                        this.continueReadingBtn.style.display = 'inline-block';
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }
        
        this.wordDisplay.textContent = '';
        this.progressText.textContent = '0 / 0 words';
        if (this.currentLocation) {
            this.currentLocation.textContent = '';
        }
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        
        // Hide speed indicator
        this.updateSpeedIndicator();
        
        // Update stats display
        this.updateStatsDisplay();
    }
    
    celebrateChapterCompletion() {
        // Create celebration element
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <div class="celebration-text">Chapter Complete!</div>
                <div class="celebration-subtext">${this.currentBook} ${this.currentChapter}</div>
            </div>
        `;
        document.body.appendChild(celebration);
        
        // Animate in
        setTimeout(() => {
            celebration.classList.add('show');
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            celebration.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(celebration);
            }, 500);
        }, 2000);
    }
    
    // Save last reading position
    saveLastPosition() {
        if (this.currentBook && this.currentChapter && this.currentIndex > 0) {
            const lastPosition = {
                book: this.currentBook,
                chapter: this.currentChapter,
                wordIndex: this.currentIndex,
                version: this.currentVersion,
                speed: this.currentSpeed,
                timestamp: Date.now()
            };
            localStorage.setItem('bibleReader_lastPosition', JSON.stringify(lastPosition));
        }
    }
    
    // Load last reading position
    loadLastPosition() {
        try {
            const saved = localStorage.getItem('bibleReader_lastPosition');
            if (saved) {
                const lastPosition = JSON.parse(saved);
                // Only show continue button if position is recent (within 30 days)
                const daysSince = (Date.now() - lastPosition.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSince < 30) {
                    this.continueReadingBtn.style.display = 'inline-block';
                    this.continueReadingBtn.dataset.book = lastPosition.book;
                    this.continueReadingBtn.dataset.chapter = lastPosition.chapter;
                    this.continueReadingBtn.dataset.wordIndex = lastPosition.wordIndex;
                }
            }
        } catch (e) {
            console.error('Error loading last position:', e);
        }
    }
    
    // Resume from last position
    resumeFromLastPosition() {
        // Prevent resuming if already reading
        if (this.isPlaying) {
            console.warn('Already reading! Cannot resume.');
            return;
        }
        
        // Disable button immediately to prevent multiple clicks
        if (this.continueReadingBtn) {
            this.continueReadingBtn.disabled = true;
        }
        
        try {
            const saved = localStorage.getItem('bibleReader_lastPosition');
            if (saved) {
                const lastPosition = JSON.parse(saved);
                this.bookSelect.value = lastPosition.book;
                this.onBookChange();
                this.chapterSelect.value = lastPosition.chapter;
                this.currentIndex = parseInt(lastPosition.wordIndex) || 0;
                if (lastPosition.speed) {
                    this.speedSelect.value = lastPosition.speed;
                }
                this.startReading(true);
            }
        } catch (e) {
            console.error('Error resuming:', e);
            // Re-enable button on error
            if (this.continueReadingBtn) {
                this.continueReadingBtn.disabled = false;
            }
        }
    }
    
    // Load statistics from localStorage
    loadStatistics() {
        try {
            const saved = localStorage.getItem('bibleReader_stats');
            if (saved) {
                this.stats = { ...this.stats, ...JSON.parse(saved) };
            }
            this.updateStatsDisplay();
        } catch (e) {
            console.error('Error loading statistics:', e);
        }
    }
    
    // Save statistics to localStorage
    saveStatistics() {
        try {
            localStorage.setItem('bibleReader_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Error saving statistics:', e);
        }
    }
    
    // Update statistics
    updateStatistics(forceUpdate = false) {
        // Only update if we're actually playing (prevent updates from multiple instances)
        if (!this.isPlaying && !forceUpdate) {
            return;
        }
        
        // Update time spent (only accumulate, don't reset session start time)
        // We'll calculate current session time in display function
        
        // Update words read - count words as we read them (only once per word)
        if (this.currentIndex > 0 && this.currentWords.length > 0) {
            // Count words read in current session (only count new words, not already counted)
            const wordsInThisSession = this.currentIndex;
            // We'll track this per chapter to avoid double counting
            if (this.wordsCountedThisChapter === undefined) {
                this.wordsCountedThisChapter = 0;
            }
            const newWords = wordsInThisSession - this.wordsCountedThisChapter;
            if (newWords > 0 && newWords <= 1) { // Only count 1 word at a time to prevent rapid counting
                this.stats.totalWordsRead += newWords;
                this.wordsCountedThisChapter = wordsInThisSession;
            }
        }
        
        // Update chapters completed when chapter finishes
        if (this.currentIndex >= this.currentWords.length && !this.chapterCounted) {
            this.stats.chaptersCompleted += 1;
            this.chapterCounted = true;
        }
        
        if (forceUpdate) {
            // Final time update when chapter completes
            if (this.stats.sessionStartTime) {
                const sessionTime = (Date.now() - this.stats.sessionStartTime) / 1000;
                this.stats.totalTimeSpent += sessionTime;
                this.stats.sessionStartTime = Date.now(); // Reset for next chapter
            }
            this.saveStatistics();
            this.updateStatsDisplay();
        }
    }
    
    // Update statistics display
    updateStatsDisplay() {
        if (!this.statsDisplay) return;
        
        // Calculate current session time if reading
        let totalTime = this.stats.totalTimeSpent;
        if (this.stats.sessionStartTime && this.isPlaying) {
            const currentSessionTime = (Date.now() - this.stats.sessionStartTime) / 1000;
            totalTime += currentSessionTime;
        }
        
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        const seconds = Math.floor(totalTime % 60);
        let timeStr = '';
        if (hours > 0) {
            timeStr = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            timeStr = `${minutes}m ${seconds}s`;
        } else {
            timeStr = `${seconds}s`;
        }
        
        const wordsFormatted = this.stats.totalWordsRead.toLocaleString();
        
        this.statsDisplay.textContent = `📊 ${wordsFormatted} words read • ${timeStr} total time • ${this.stats.chaptersCompleted} chapters completed`;
        this.statsBar.style.display = 'block';
    }
    
    // Search functionality
    handleSearchInput(e) {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            if (this.searchBtn) {
                this.searchBtn.style.display = 'block';
            }
        } else {
            if (this.searchBtn) {
                this.searchBtn.style.display = 'none';
            }
            if (this.searchResults) {
                this.searchResults.style.display = 'none';
            }
        }
    }
    
    performSearch() {
        const query = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        if (!query || query.length < 2) {
            return;
        }
        
        if (!this.searchResults) return;
        
        const results = [];
        const maxResults = 50; // Limit results for performance
        
        // Search through all books, chapters, and verses
        Object.keys(this.bibleData).forEach(bookName => {
            const book = this.bibleData[bookName];
            Object.keys(book).forEach(chapterNum => {
                const chapter = book[chapterNum];
                Object.keys(chapter).forEach(verseNum => {
                    const verseText = chapter[verseNum].toLowerCase();
                    if (verseText.includes(query)) {
                        if (results.length < maxResults) {
                            results.push({
                                book: bookName,
                                chapter: chapterNum,
                                verse: verseNum,
                                text: this.bibleData[bookName][chapterNum][verseNum]
                            });
                        }
                    }
                });
            });
        });
        
        // Display results
        if (results.length === 0) {
            this.searchResults.innerHTML = '<p style="padding: 10px; color: #666;">No results found.</p>';
            this.searchResults.style.display = 'block';
            return;
        }
        
        let html = `<div style="padding: 5px; font-size: 0.9rem; color: #666; border-bottom: 1px solid #e0e0e0; margin-bottom: 5px;">Found ${results.length} result${results.length !== 1 ? 's' : ''}</div>`;
        results.forEach(result => {
            const highlightedText = result.text.replace(
                new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<mark style="background: #ffeb3b; padding: 2px 4px;">$1</mark>'
            );
            html += `
                <div class="search-result-item" style="padding: 10px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.2s;" 
                     onmouseover="this.style.background='#f5f5f5'" 
                     onmouseout="this.style.background='white'"
                     onclick="window.bibleReader?.jumpToVerse('${result.book}', '${result.chapter}', '${result.verse}')">
                    <strong style="color: #667eea;">${result.book} ${result.chapter}:${result.verse}</strong>
                    <div style="margin-top: 5px; color: #333; font-size: 0.9rem;">${highlightedText}</div>
                </div>
            `;
        });
        
        this.searchResults.innerHTML = html;
        this.searchResults.style.display = 'block';
    }
    
    jumpToVerse(book, chapter, verse) {
        // Stop current reading if active
        if (this.isPlaying) {
            this.stopReading();
        }
        
        // Set book and chapter
        if (this.bookSelect) {
            this.bookSelect.value = book;
            this.onBookChange();
        }
        
        // Wait for chapters to load, then set chapter
        setTimeout(() => {
            if (this.chapterSelect) {
                this.chapterSelect.value = chapter;
                this.onChapterChange();
                
                // Start reading from this verse
                setTimeout(() => {
                    this.startReading();
                    // Find the verse index and start from there
                    if (this.prepareText()) {
                        // Find verse in words array
                        const verseText = this.bibleData[book][chapter][verse];
                        if (verseText) {
                            const words = verseText.split(/\s+/);
                            // Try to find starting position (approximate)
                            let foundIndex = -1;
                            for (let i = 0; i < this.currentWords.length; i++) {
                                if (this.currentWords[i].toLowerCase().includes(words[0].toLowerCase().replace(/[.,;:!?]/g, ''))) {
                                    foundIndex = i;
                                    break;
                                }
                            }
                            if (foundIndex >= 0) {
                                this.currentIndex = foundIndex;
                            }
                        }
                    }
                }, 100);
            }
        }, 100);
        
        // Hide search results
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
        if (this.searchInput) {
            this.searchInput.value = '';
        }
    }
    
    // Reading plans
    onReadingPlanChange() {
        const plan = this.readingPlanSelect ? this.readingPlanSelect.value : '';
        if (!plan) {
            return;
        }
        
        // Stop current reading if active
        if (this.isPlaying) {
            this.stopReading();
        }
        
        // Get today's reading based on plan
        const todayReading = this.getTodayReading(plan);
        if (todayReading) {
            if (this.bookSelect) {
                this.bookSelect.value = todayReading.book;
                this.onBookChange();
            }
            
            setTimeout(() => {
                if (this.chapterSelect) {
                    this.chapterSelect.value = todayReading.chapter;
                    this.onChapterChange();
                }
            }, 100);
        }
    }
    
    getTodayReading(plan) {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        
        if (plan === 'bible-in-year') {
            // Bible in a year: ~3-4 chapters per day
            // Simplified: distribute 1189 chapters over 365 days
            const chaptersPerDay = 1189 / 365;
            const targetChapter = Math.floor(dayOfYear * chaptersPerDay);
            
            // Find which book/chapter this corresponds to
            let chapterCount = 0;
            for (const book of this.allBooks) {
                if (!this.bibleData[book]) continue;
                const chapters = Object.keys(this.bibleData[book]);
                if (chapterCount + chapters.length >= targetChapter) {
                    const chapterIndex = targetChapter - chapterCount;
                    if (chapterIndex > 0 && chapterIndex <= chapters.length) {
                        return {
                            book: book,
                            chapter: chapters[chapterIndex - 1]
                        };
                    }
                }
                chapterCount += chapters.length;
            }
        } else if (plan === 'nt-in-30') {
            // New Testament in 30 days
            const ntBooks = this.allBooks.slice(39); // Matthew onwards (0-indexed, so 39 = 40th book)
            const totalNTChapters = ntBooks.reduce((sum, book) => {
                return sum + (this.bibleData[book] ? Object.keys(this.bibleData[book]).length : 0);
            }, 0);
            const chaptersPerDay = totalNTChapters / 30;
            const targetChapter = Math.floor(dayOfYear % 30 * chaptersPerDay);
            
            let chapterCount = 0;
            for (const book of ntBooks) {
                if (!this.bibleData[book]) continue;
                const chapters = Object.keys(this.bibleData[book]);
                if (chapterCount + chapters.length >= targetChapter) {
                    const chapterIndex = targetChapter - chapterCount;
                    if (chapterIndex > 0 && chapterIndex <= chapters.length) {
                        return {
                            book: book,
                            chapter: chapters[chapterIndex - 1]
                        };
                    }
                }
                chapterCount += chapters.length;
            }
        } else if (plan === 'psalms-proverbs-month') {
            // Psalms (150 chapters) + Proverbs (31 chapters) = 181 chapters in 30 days
            const dayOfMonth = today.getDate();
            if (dayOfMonth <= 30) {
                if (dayOfMonth <= 150 && this.bibleData['Psalms']) {
                    const psalmsChapters = Object.keys(this.bibleData['Psalms']).sort((a, b) => parseInt(a) - parseInt(b));
                    if (psalmsChapters[dayOfMonth - 1]) {
                        return {
                            book: 'Psalms',
                            chapter: psalmsChapters[dayOfMonth - 1]
                        };
                    }
                } else if (this.bibleData['Proverbs']) {
                    const proverbsChapters = Object.keys(this.bibleData['Proverbs']).sort((a, b) => parseInt(a) - parseInt(b));
                    const proverbsDay = dayOfMonth - 150;
                    if (proverbsDay > 0 && proverbsDay <= proverbsChapters.length) {
                        return {
                            book: 'Proverbs',
                            chapter: proverbsChapters[proverbsDay - 1]
                        };
                    }
                }
            }
        }
        
        return null;
    }
}

// Make BibleSpeedReader instance globally accessible for search results
let bibleReader;

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
        bibleReader = new BibleSpeedReader();
    } catch (error) {
        console.error('Error initializing BibleSpeedReader:', error);
        alert('Error initializing app: ' + error.message);
    }
});
