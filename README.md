# 🎯 Advanced Task Management Board

A feature-rich, responsive task management application built with vanilla JavaScript, offering enterprise-level functionality with an intuitive drag-and-drop interface.

## ✨ Features

### 🎨 **Dynamic User Interface**
- **Drag & Drop Functionality** - Seamless task movement between columns with visual feedback
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Theme System** - 4 themes including time-based auto-switching and manual dark/light modes
- **Smooth Animations** - Hover effects, transitions, and visual feedback for enhanced UX

### 📋 **Advanced Task Management**
- **Priority Levels** - High, Medium, Low with color-coded indicators
- **Categories** - Work, Personal, Study, Health with custom badges
- **Due Dates** - Automatic overdue detection with visual alerts
- **Progress Tracking** - 0-100% completion with visual progress bars
- **Task Descriptions** - Expandable detailed descriptions

### ⏱️ **Productivity Features**
- **Built-in Timer** - Track time spent on individual tasks
- **Search & Filter** - Real-time filtering by text, priority, and category
- **Bulk Operations** - Multi-select tasks for batch actions
- **Statistics Dashboard** - Comprehensive analytics and productivity metrics

### 💾 **Data Management**
- **Persistent Storage** - Automatic save with localStorage integration
- **Import/Export** - JSON-based data backup and restore
- **Undo/Redo** - 50-level history with state management
- **Auto-Backup** - Automatic backups every 10 saves

### 🔔 **Smart Notifications**
- **Due Date Alerts** - Browser notifications for upcoming deadlines
- **Sound Effects** - Audio feedback with toggle option
- **Visual Indicators** - Pulsing animations for overdue tasks
- **Toast Notifications** - Real-time action confirmations

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/advanced-task-board.git
   cd advanced-task-board
   ```

2. **Open with Live Server**
   ```bash
   # Using VS Code Live Server extension
   # Or serve with any local server on port 5500
   ```

3. **Access the application**
   ```
   http://localhost:5500
   ```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: Browser LocalStorage API
- **Design**: CSS Grid, Flexbox, CSS Animations
- **Icons**: Unicode Emojis, CSS-based icons
- **Audio**: Web Audio API for sound effects

## 📱 Usage

### Adding Tasks
1. Fill in the task form with title, priority, category, and due date
2. Click "Add Task" or press Enter
3. Task automatically appears in the TO-DO column

### Managing Tasks
- **Move**: Drag and drop between columns
- **Edit**: Click the edit button to modify task details
- **Timer**: Use the timer button to track work time
- **Delete**: Remove tasks individually or in bulk
- **Progress**: Update completion percentage

### Advanced Features
- **Bulk Actions**: Select multiple tasks using checkboxes
- **Search**: Use the search bar for instant filtering
- **Export**: Download your board as JSON
- **Themes**: Toggle between 4 different visual themes

## 🎯 Project Structure

```
advanced-task-board/
│
├── index.html          # Main HTML structure
├── style.css           # Embedded styles (in HTML)
├── script.js           # Core JavaScript logic
├── README.md           # Project documentation
```

## 🔧 Key Functionalities

### Data Persistence
```javascript
// Automatic saving after every action
function saveTasks() {
    const boardState = {
        tasks: tasks,
        columns: getColumnState(),
        preferences: userPreferences
    };
    localStorage.setItem('taskBoardData', JSON.stringify(boardState));
}
```

### Drag & Drop Implementation
```javascript
// Enhanced drag and drop with visual feedback
element.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    e.target.classList.add('is-dragging');
});
```

### Real-time Filtering
```javascript
// Dynamic search and filter system
function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    tasks.forEach(task => {
        const matches = task.title.toLowerCase().includes(searchTerm);
        toggleTaskVisibility(task, matches);
    });
}
```

## 🎨 Customization

The application is highly customizable:

- **Themes**: Modify CSS custom properties for color schemes
- **Categories**: Add new task categories in the dropdown
- **Columns**: Easy to add new workflow columns
- **Sounds**: Replace audio feedback with custom sounds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Performance

- **Lightweight**: ~50KB total size
- **Fast Loading**: Vanilla JS, no framework overhead
- **Efficient Storage**: Optimized localStorage usage
- **Responsive**: Smooth performance on all devices

## 🔮 Future Enhancements

- [ ] Cloud sync integration
- [ ] Collaborative features
- [ ] Advanced analytics
- [ ] Mobile app version
- [ ] Plugin system

## 👨‍💻 Developer

**Your Name**
- GitHub: (https://github.com/ishitaajain22-tech)
- LinkedIn: https://www.linkedin.com/in/ishita-jain-8091581b2/

---

⭐ **Star this repository if you found it helpful!**

*Built with ❤️ and lots of ☕*
