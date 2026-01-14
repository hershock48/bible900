# RSVP Speed Reading - Mechanics Explained

## Overview
The viral Twitter video demonstrates **Rapid Serial Visual Presentation (RSVP)**, a speed reading technique that displays words sequentially at a fixed focal point.

## Key Mechanics

### 1. **Rapid Serial Visual Presentation (RSVP)**
- Words are flashed **one at a time** at a **fixed point** on the screen
- Eliminates the need for eye movements (saccades) between words
- Removes the need to scan across lines of text

### 2. **Red Focal Point (Optimal Recognition Point - ORP)**
- A **red dot or highlight** marks where each word appears
- This aligns with the natural focal point of human vision
- Helps maintain focus and reduces cognitive load
- The red color draws attention to the optimal reading position

### 3. **Speed Progression**
- Starts at **300 words per minute (wpm)**
- Gradually increases to **900 wpm**
- Allows users to adapt to the technique progressively
- Higher speeds challenge the reader's processing capacity

### 4. **How It Works**
- **Traditional reading**: Eyes move across lines, making saccades (jumps) and fixations (pauses)
- **RSVP reading**: Words appear at the same location, eliminating:
  - Saccadic eye movements
  - Line tracking
  - Refocusing time
  - Backtracking

### 5. **Benefits**
- **Increased speed**: Can reach 900+ wpm
- **Reduced eye strain**: Less eye movement
- **Focused attention**: Single point of focus
- **Efficient processing**: Direct word-to-brain pathway

### 6. **Limitations**
- **Comprehension trade-off**: Comprehension typically decreases significantly beyond 400-500 wpm
- **No backtracking**: Can't easily re-read previous words
- **Context loss**: May miss nuances and flow of longer sentences
- **Not suitable for all content**: Best for simple, linear text

## Technical Implementation

To create an RSVP speed reader, you would need:

1. **Text processing**: Break text into individual words
2. **Display mechanism**: Show one word at a time at a fixed position
3. **Timing calculation**: 
   - Words per minute → milliseconds per word
   - Example: 300 wpm = 200ms per word, 900 wpm = 66.7ms per word
4. **Visual design**: 
   - Red focal point/highlight
   - Large, readable font
   - Centered positioning
5. **Speed control**: Ability to adjust reading speed
6. **Progression system**: Gradually increase speed from 300 to 900 wpm

## Formula
```
Time per word (ms) = 60,000 / words_per_minute
```

Examples:
- 300 wpm = 200ms per word
- 600 wpm = 100ms per word  
- 900 wpm = 66.7ms per word
