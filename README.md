# Bible Speed Reader

A simple, clean website for speed reading the entire Bible using RSVP (Rapid Serial Visual Presentation) technique.

## Features

- **RSVP Speed Reading**: Words appear one at a time at a red focal point
- **Full Bible Access**: Select any book and chapter
- **Adjustable Speed**: Choose from 300 to 900 words per minute
- **Clean Interface**: Simple, focused design
- **Progress Tracking**: See your reading progress in real-time

## How to Use

1. Open `index.html` in a web browser
2. Select a book from the dropdown
3. Select a chapter
4. Choose your reading speed (300-900 WPM)
5. Click "Start Reading"
6. Use "Pause" to pause/resume, or "Stop" to return to selection

## Getting the Full Bible Text

The current `bible-data.js` file contains only sample chapters. To add the complete Bible:

### Option 1: Use the Fetch Script (Recommended)

1. Make sure you have Node.js installed
2. Run the fetch script:
   ```bash
   node fetch-bible.js
   ```
3. This will fetch the complete King James Version Bible and populate `bible-data.js`

### Option 2: Manual Addition

You can manually add Bible text to `bible-data.js` following this structure:

```javascript
const bibleData = {
    "Book Name": {
        "1": {
            "1": "First verse text",
            "2": "Second verse text",
            // ... more verses
        },
        "2": {
            "1": "First verse of chapter 2",
            // ... more verses
        }
    }
};
```

### Option 3: Use a Bible API

You can modify the code to fetch Bible text from an API in real-time instead of loading it all at once. Some options:
- Bible API (bible-api.com)
- ESV API (api.esv.org)
- Other public Bible APIs

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - RSVP reading logic and controls
- `bible-data.js` - Bible text data (needs to be populated with full Bible)
- `fetch-bible.js` - Script to fetch complete Bible text

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Notes

- The RSVP technique can significantly increase reading speed
- Comprehension may decrease at higher speeds (900 WPM)
- The red focal point helps maintain focus and reduces eye strain
- All Bible text should be in the public domain (KJV is recommended)
