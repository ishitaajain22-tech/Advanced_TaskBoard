        let draggedItem = null;
        let tasks = [];
        let taskIdCounter = 1;
        let currentTheme = 'day';
        let soundEnabled = true;
        let selectedTasks = new Set();
        let history = [];
        let historyIndex = -1;
        let timers = new Map();
        let currentEditingTask = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            updateTimeBasedTheme();
            loadTasks();
            updateTaskCounts();
            setInterval(updateTimeBasedTheme, 60000); // Update every minute
            setInterval(checkDueDates, 60000); // Check due dates every minute
        });

        function setupEventListeners() {
            // Form submission
            document.getElementById('todo-form').addEventListener('submit', handleAddTask);
            
            // Search and filter
            document.getElementById('search-input').addEventListener('input', filterTasks);
            document.getElementById('priority-filter').addEventListener('change', filterTasks);
            document.getElementById('category-filter').addEventListener('change', filterTasks);
            
            // Modal close buttons
            document.querySelectorAll('.close').forEach(close => {
                close.addEventListener('click', function() {
                    this.closest('.modal').style.display = 'none';
                });
            });
            
            // Edit form
            document.getElementById('edit-form').addEventListener('submit', handleEditTask);
            document.getElementById('edit-progress').addEventListener('input', function() {
                document.getElementById('progress-value').textContent = this.value + '%';
            });
            
            // Drag and drop setup
            setupDragAndDrop();
        }

        function setupDragAndDrop() {
            const cols = document.querySelectorAll('.col');
            
            cols.forEach(col => {
                col.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    col.classList.add('drag-over');
                });
                
                col.addEventListener('dragleave', (e) => {
                    if (!col.contains(e.relatedTarget)) {
                        col.classList.remove('drag-over');
                    }
                });
                
                col.addEventListener('drop', (e) => {
                    e.preventDefault();
                    col.classList.remove('drag-over');
                    
                    if (draggedItem) {
                        saveState();
                        col.appendChild(draggedItem);
                        playSound('move');
                        saveTasks();
                        updateTaskCounts();
                        showNotification('Task moved successfully!');
                    }
                });
            });
        }

        function handleAddTask(e) {
            e.preventDefault();
            
            const title = document.getElementById('todo-in').value.trim();
            const priority = document.getElementById('priority').value;
            const category = document.getElementById('category').value;
            const dueDate = document.getElementById('due-date').value;
            const description = document.getElementById('task-description').value.trim();
            
            if (!title) return;
            
            saveState();
            
            const taskData = {
                id: taskIdCounter++,
                title,
                priority,
                category,
                dueDate,
                description,
                progress: 0,
                createdAt: new Date(),
                timeSpent: 0
            };
            
            tasks.push(taskData);
            
            const taskElement = createTaskElement(taskData);
            document.getElementById('todo-col').appendChild(taskElement);
            
            // Reset form
            document.getElementById('todo-form').reset();
            
            saveTasks();
            updateTaskCounts();
            playSound('add');
            showNotification('Task added successfully!');
        }

        function createTaskElement(taskData) {
            const taskEl = document.createElement('div');
            taskEl.className = `work ${taskData.priority}-priority`;
            taskEl.draggable = true;
            taskEl.dataset.taskId = taskData.id;
            
            const isOverdue = taskData.dueDate && new Date(taskData.dueDate) < new Date();
            if (isOverdue) {
                taskEl.classList.add('overdue');
            }
            
            const dueDisplay = taskData.dueDate ? 
                `Due: ${new Date(taskData.dueDate).toLocaleDateString()}` : 
                'No due date';
            
            const timeSpentDisplay = formatTime(taskData.timeSpent);
            
            taskEl.innerHTML = `
                <input type="checkbox" class="task-select" onchange="handleTaskSelect(this)" style="margin-bottom: 8px;">
                <div class="task-content">
                    <div class="task-title">${taskData.title}</div>
                    <div class="task-description">${taskData.description}</div>
                </div>
                <div class="task-meta">
                    <span class="priority-badge ${taskData.priority}">${taskData.priority}</span>
                    <span class="category-badge">${taskData.category}</span>
                </div>
                <div class="task-meta">
                    <span>${dueDisplay}</span>
                    <span class="timer-display">⏱️ ${timeSpentDisplay}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${taskData.progress}%"></div>
                </div>
                <div class="task-actions">
                    <button class="action-btn expand-btn" onclick="toggleDescription(this)">👁️</button>
                    <button class="action-btn timer-btn" onclick="toggleTimer(${taskData.id})" id="timer-${taskData.id}">⏱️</button>
                    <button class="action-btn edit-btn" onclick="editTask(${taskData.id})">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${taskData.id})">🗑️</button>
                </div>
            `;
            
            // Add drag event listeners
            taskEl.addEventListener('dragstart', (e) => {
                draggedItem = e.target;
                e.target.classList.add('is-dragging');
            });
            
            taskEl.addEventListener('dragend', (e) => {
                e.target.classList.remove('is-dragging');
                draggedItem = null;
            });
            
            return taskEl;
        }

        function toggleDescription(btn) {
            const taskEl = btn.closest('.work');
            const description = taskEl.querySelector('.task-description');
            
            if (description.style.display === 'none' || !description.style.display) {
                description.style.display = 'block';
                btn.textContent = '🙈';
            } else {
                description.style.display = 'none';
                btn.textContent = '👁️';
            }
        }

        function toggleTimer(taskId) {
            const timerBtn = document.getElementById(`timer-${taskId}`);
            const taskData = tasks.find(t => t.id === taskId);
            
            if (timers.has(taskId)) {
                // Stop timer
                clearInterval(timers.get(taskId).interval);
                timers.delete(taskId);
                timerBtn.textContent = '⏱️';
                timerBtn.style.background = 'var(--info-color)';
                playSound('stop');
            } else {
                // Start timer
                const startTime = Date.now();
                const interval = setInterval(() => {
                    taskData.timeSpent += 1;
                    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                    const timerDisplay = taskEl.querySelector('.timer-display');
                    timerDisplay.textContent = `⏱️ ${formatTime(taskData.timeSpent)}`;
                    saveTasks();
                }, 1000);
                
                timers.set(taskId, { interval, startTime });
                timerBtn.textContent = '⏸️';
                timerBtn.style.background = 'var(--danger-color)';
                playSound('start');
            }
        }

        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hrs > 0) {
                return `${hrs}h ${mins}m`;
            } else if (mins > 0) {
                return `${mins}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        }

        function editTask(taskId) {
            const taskData = tasks.find(t => t.id === taskId);
            if (!taskData) return;
            
            currentEditingTask = taskId;
            
            document.getElementById('edit-title').value = taskData.title;
            document.getElementById('edit-desc').value = taskData.description;
            document.getElementById('edit-priority').value = taskData.priority;
            document.getElementById('edit-category').value = taskData.category;
            document.getElementById('edit-due').value = taskData.dueDate || '';
            document.getElementById('edit-progress').value = taskData.progress;
            document.getElementById('progress-value').textContent = taskData.progress + '%';
            
            document.getElementById('edit-modal').style.display = 'block';
        }

        function handleEditTask(e) {
            e.preventDefault();
            
            if (!currentEditingTask) return;
            
            saveState();
            
            const taskData = tasks.find(t => t.id === currentEditingTask);
            taskData.title = document.getElementById('edit-title').value;
            taskData.description = document.getElementById('edit-desc').value;
            taskData.priority = document.getElementById('edit-priority').value;
            taskData.category = document.getElementById('edit-category').value;
            taskData.dueDate = document.getElementById('edit-due').value;
            taskData.progress = parseInt(document.getElementById('edit-progress').value);
            
            // Update the task element
            const taskEl = document.querySelector(`[data-task-id="${currentEditingTask}"]`);
            if (taskEl) {
                // Remove old classes and add new ones
                taskEl.className = `work ${taskData.priority}-priority`;
                
                // Check if overdue
                const isOverdue = taskData.dueDate && new Date(taskData.dueDate) < new Date();
                if (isOverdue) {
                    taskEl.classList.add('overdue');
                }
                
                // Update content
                const newTaskEl = createTaskElement(taskData);
                taskEl.parentNode.replaceChild(newTaskEl, taskEl);
            }
            
            saveTasks();
            document.getElementById('edit-modal').style.display = 'none';
            showNotification('Task updated successfully!');
            currentEditingTask = null;
        }

        function deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                saveState();
                
                // Stop timer if running
                if (timers.has(taskId)) {
                    clearInterval(timers.get(taskId).interval);
                    timers.delete(taskId);
                }
                
                tasks = tasks.filter(t => t.id !== taskId);
                const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskEl) {
                    taskEl.remove();
                }
                
                saveTasks();
                updateTaskCounts();
                playSound('delete');
                showNotification('Task deleted successfully!');
            }
        }

        function handleTaskSelect(checkbox) {
            const taskId = parseInt(checkbox.closest('.work').dataset.taskId);
            
            if (checkbox.checked) {
                selectedTasks.add(taskId);
            } else {
                selectedTasks.delete(taskId);
            }
            
            // Show/hide bulk actions
            const bulkActions = document.getElementById('bulk-actions');
            bulkActions.style.display = selectedTasks.size > 0 ? 'block' : 'none';
        }

        function bulkMove(columnId) {
            if (selectedTasks.size === 0) return;
            
            saveState();
            const column = document.getElementById(columnId);
            
            selectedTasks.forEach(taskId => {
                const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskEl) {
                    column.appendChild(taskEl);
                }
            });
            
            clearSelection();
            saveTasks();
            updateTaskCounts();
            playSound('move');
            showNotification(`${selectedTasks.size} tasks moved successfully!`);
        }

        function bulkDelete() {
            if (selectedTasks.size === 0) return;
            
            if (confirm(`Are you sure you want to delete ${selectedTasks.size} selected tasks?`)) {
                saveState();
                
                selectedTasks.forEach(taskId => {
                    // Stop timer if running
                    if (timers.has(taskId)) {
                        clearInterval(timers.get(taskId).interval);
                        timers.delete(taskId);
                    }
                    
                    tasks = tasks.filter(t => t.id !== taskId);
                    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
                    if (taskEl) {
                        taskEl.remove();
                    }
                });
                
                clearSelection();
                saveTasks();
                updateTaskCounts();
                playSound('delete');
                showNotification(`${selectedTasks.size} tasks deleted successfully!`);
            }
        }

        function clearSelection() {
            selectedTasks.clear();
            document.querySelectorAll('.task-select').forEach(cb => cb.checked = false);
            document.getElementById('bulk-actions').style.display = 'none';
        }

        function filterTasks() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const priorityFilter = document.getElementById('priority-filter').value;
            const categoryFilter = document.getElementById('category-filter').value;
            
            document.querySelectorAll('.work').forEach(taskEl => {
                const taskId = parseInt(taskEl.dataset.taskId);
                const taskData = tasks.find(t => t.id === taskId);
                
                if (!taskData) {
                    taskEl.style.display = 'none';
                    return;
                }
                
                const matchesSearch = taskData.title.toLowerCase().includes(searchTerm) ||
                                    taskData.description.toLowerCase().includes(searchTerm);
                const matchesPriority = !priorityFilter || taskData.priority === priorityFilter;
                const matchesCategory = !categoryFilter || taskData.category === categoryFilter;
                
                if (matchesSearch && matchesPriority && matchesCategory) {
                    taskEl.style.display = 'block';
                } else {
                    taskEl.style.display = 'none';
                }
            });
        }

        function updateTaskCounts() {
            const columns = ['todo-col', 'backlog-col', 'in-process-col', 'done-col'];
            
            columns.forEach(colId => {
                const col = document.getElementById(colId);
                const visibleTasks = col.querySelectorAll('.work:not([style*="display: none"])').length;
                col.querySelector('.task-count').textContent = visibleTasks;
            });
        }

        function toggleTheme() {
            const themes = ['day', 'sunset', 'night', 'dark-theme'];
            const currentIndex = themes.indexOf(currentTheme);
            currentTheme = themes[(currentIndex + 1) % themes.length];
            
            document.body.className = currentTheme;
            playSound('switch');
            showNotification(`Switched to ${currentTheme.replace('-', ' ')} theme`);
        }

        function updateTimeBasedTheme() {
            const hour = new Date().getHours();
            let timeTheme;
            
            if (hour >= 18 || hour < 6) {
                timeTheme = 'night';
            } else if (hour >= 15 && hour <= 17) {
                timeTheme = 'sunset';
            } else {
                timeTheme = 'day';
            }
            
            if (currentTheme !== 'dark-theme') {
                currentTheme = timeTheme;
                document.body.className = currentTheme;
            }
        }

        function toggleSound() {
            soundEnabled = !soundEnabled;
            const btn = document.querySelector('.sound-toggle');
            btn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound';
            playSound('switch');
        }

        function playSound(type) {
            if (!soundEnabled) return;
            
            // Create audio context for sound effects
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                let frequency;
                switch (type) {
                    case 'add': frequency = 800; break;
                    case 'delete': frequency = 400; break;
                    case 'move': frequency = 600; break;
                    case 'start': frequency = 1000; break;
                    case 'stop': frequency = 500; break;
                    default: frequency = 700;
                }
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (e) {
                console.log('Audio not supported');
            }
        }

        function showStats() {
            const totalTasks = tasks.length;
            const completedTasks = document.getElementById('done-col').querySelectorAll('.work').length;
            const inProgressTasks = document.getElementById('in-process-col').querySelectorAll('.work').length;
            const pendingTasks = document.getElementById('backlog-col').querySelectorAll('.work').length;
            const todoTasks = document.getElementById('todo-col').querySelectorAll('.work').length;
            
            const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
            const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
            
            const totalTimeSpent = tasks.reduce((total, task) => total + task.timeSpent, 0);
            const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((total, task) => total + task.progress, 0) / totalTasks) : 0;
            
            document.getElementById('stats-grid').innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalTasks}</div>
                    <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${completedTasks}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${inProgressTasks}</div>
                    <div class="stat-label">In Progress</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${pendingTasks}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${todoTasks}</div>
                    <div class="stat-label">To-Do</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${highPriorityTasks}</div>
                    <div class="stat-label">High Priority</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${overdueTasks}</div>
                    <div class="stat-label">Overdue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatTime(totalTimeSpent)}</div>
                    <div class="stat-label">Time Spent</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgProgress}%</div>
                    <div class="stat-label">Avg Progress</div>
                </div>
            `;
            
            document.getElementById('stats-modal').style.display = 'block';
        }

        function exportTasks() {
            const exportData = {
                tasks: tasks,
                exported: new Date().toISOString(),
                columns: {
                    'todo-col': Array.from(document.getElementById('todo-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'backlog-col': Array.from(document.getElementById('backlog-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'in-process-col': Array.from(document.getElementById('in-process-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'done-col': Array.from(document.getElementById('done-col').querySelectorAll('.work')).map(el => el.dataset.taskId)
                }
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Tasks exported successfully!');
        }

        function saveState() {
            const state = {
                tasks: JSON.parse(JSON.stringify(tasks)),
                columns: {
                    'todo-col': Array.from(document.getElementById('todo-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'backlog-col': Array.from(document.getElementById('backlog-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'in-process-col': Array.from(document.getElementById('in-process-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
                    'done-col': Array.from(document.getElementById('done-col').querySelectorAll('.work')).map(el => el.dataset.taskId)
                }
            };
            
            // Remove future history if we're not at the end
            if (historyIndex < history.length - 1) {
                history = history.slice(0, historyIndex + 1);
            }
            
            history.push(state);
            
            // Limit history size
            if (history.length > 50) {
                history.shift();
            } else {
                historyIndex++;
            }
            
            updateUndoRedoButtons();
        }

        function undo() {
            if (historyIndex <= 0) return;
            
            historyIndex--;
            restoreState(history[historyIndex]);
            updateUndoRedoButtons();
            showNotification('Undo successful!');
        }

        function redo() {
            if (historyIndex >= history.length - 1) return;
            
            historyIndex++;
            restoreState(history[historyIndex]);
            updateUndoRedoButtons();
            showNotification('Redo successful!');
        }

        function restoreState(state) {
            tasks = JSON.parse(JSON.stringify(state.tasks));
            
            // Clear all columns
            ['todo-col', 'backlog-col', 'in-process-col', 'done-col'].forEach(colId => {
                const col = document.getElementById(colId);
                Array.from(col.querySelectorAll('.work')).forEach(el => el.remove());
            });
            
            // Recreate task elements and place them in correct columns
            Object.entries(state.columns).forEach(([colId, taskIds]) => {
                const col = document.getElementById(colId);
                taskIds.forEach(taskId => {
                    const taskData = tasks.find(t => t.id == taskId);
                    if (taskData) {
                        const taskEl = createTaskElement(taskData);
                        col.appendChild(taskEl);
                    }
                });
            });
            
            updateTaskCounts();
            saveTasks();
        }

        function updateUndoRedoButtons() {
            document.querySelector('.undo-btn').disabled = historyIndex <= 0;
            document.querySelector('.redo-btn').disabled = historyIndex >= history.length - 1;
        }

        function checkDueDates() {
            const now = new Date();
            
            tasks.forEach(task => {
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    const timeDiff = dueDate - now;
                    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    
                    // Show notification for tasks due in 1 day
                    if (daysDiff === 1 && !task.notified) {
                        showNotification(`Task "${task.title}" is due tomorrow!`, 'warning');
                        task.notified = true;
                        
                        // Browser notification if permission granted
                        if (Notification.permission === 'granted') {
                            new Notification('Task Due Tomorrow', {
                                body: `"${task.title}" is due tomorrow!`,
                                icon: '🎯'
                            });
                        }
                    }
                    
                    // Update overdue status
                    const taskEl = document.querySelector(`[data-task-id="${task.id}"]`);
                    if (taskEl && timeDiff < 0) {
                        taskEl.classList.add('overdue');
                    }
                }
            });
        }

        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = 'notification show';
            
            if (type === 'warning') {
                notification.style.background = 'var(--warning-color)';
                notification.style.color = 'black';
            } else if (type === 'error') {
                notification.style.background = 'var(--danger-color)';
            } else {
                notification.style.background = 'var(--success-color)';
                notification.style.color = 'white';
            }
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        function saveTasks() {
    const state = {
        tasks: tasks,
        columns: {
            'todo-col': Array.from(document.getElementById('todo-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
            'backlog-col': Array.from(document.getElementById('backlog-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
            'in-process-col': Array.from(document.getElementById('in-process-col').querySelectorAll('.work')).map(el => el.dataset.taskId),
            'done-col': Array.from(document.getElementById('done-col').querySelectorAll('.work')).map(el => el.dataset.taskId)
        },
        taskIdCounter: taskIdCounter
    };
    localStorage.setItem("taskBoardData", JSON.stringify(state));
    console.log("Tasks saved to localStorage");
}

function loadTasks() {
    const saved = localStorage.getItem("taskBoardData");
    if (!saved) {
        console.log("No tasks in localStorage, starting fresh");
        return;
    }
    try {
        const state = JSON.parse(saved);
        tasks = state.tasks || [];
        taskIdCounter = state.taskIdCounter || 1;

        // Clear all columns
        ['todo-col', 'backlog-col', 'in-process-col', 'done-col'].forEach(colId => {
            document.getElementById(colId).innerHTML = `
                <div class="col-header">
                    <h3 class="heading black">${document.querySelector(`#${colId} .heading`).textContent}</h3>
                    <span class="task-count">0</span>
                </div>
            `;
        });

        Object.entries(state.columns).forEach(([colId, taskIds]) => {
            const col = document.getElementById(colId);
            taskIds.forEach(taskId => {
                const taskData = tasks.find(t => t.id == taskId);
                if (taskData) {
                    const taskEl = createTaskElement(taskData);
                    col.appendChild(taskEl);
                }
            });
        });

        updateTaskCounts();
        console.log("Tasks loaded from localStorage");
    } catch (e) {
        console.error("Error loading tasks:", e);
        localStorage.removeItem("taskBoardData"); // reset if corrupted
    }

    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}
