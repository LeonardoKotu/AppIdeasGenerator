let selectedEvents = [];
let currentDay = 1;
let generatedSchedules = [];
let currentScheduleIndex = 0;
let groupMembers = [{ name: "Я", events: [], id: 0 }];
let isLiveEditMode = false;
let currentTime = new Date();
let currentMemberEditing = null;
let isDarkTheme = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Загружаем сохранённую тему
    loadTheme();
    
    loadEventsForDay(currentDay);
    updateSelectedCount();
    
    // Обработчики событий
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentDay = parseInt(this.getAttribute('data-day'));
            loadEventsForDay(currentDay);
        });
    });
    
    document.getElementById('generateBtn').addEventListener('click', generateSchedules);
    document.getElementById('clearBtn').addEventListener('click', clearSelectedEvents);
    document.getElementById('searchInput').addEventListener('input', filterEvents);
    document.getElementById('groupPlanBtn').addEventListener('click', toggleGroupPlanMode);
    document.getElementById('liveEditBtn').addEventListener('click', toggleLiveEditMode);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Модальные окна
    document.getElementById('addMemberBtn').addEventListener('click', addGroupMember);
    document.getElementById('generateGroupBtn').addEventListener('click', generateGroupSchedules);
    document.getElementById('saveMemberEventsBtn').addEventListener('click', saveMemberEvents);
    
    // Обработчики для закрытия модальных окон по крестикам
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Обновляем время каждую минуту в режиме фестиваля
    setInterval(updateCurrentTime, 60000);
    
    // Закрытие модальных окон при клике вне их
    setupModalCloseHandlers();
}

function setupModalCloseHandlers() {
    window.onclick = function(event) {
        const groupModal = document.getElementById('groupModal');
        const memberModal = document.getElementById('memberEventsModal');
        
        if (event.target === groupModal) {
            closeGroupModal();
        }
        if (event.target === memberModal) {
            closeMemberModal();
        }
    }
}

// === УПРАВЛЕНИЕ ТЕМОЙ ===

function loadTheme() {
    const savedTheme = localStorage.getItem('festivalPlannerTheme');
    if (savedTheme === 'dark') {
        enableDarkTheme();
    } else {
        enableLightTheme();
    }
}

function toggleTheme() {
    if (isDarkTheme) {
        enableLightTheme();
    } else {
        enableDarkTheme();
    }
    saveTheme();
}

function enableDarkTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggle').innerHTML = '<span class="theme-text">Светлая тема</span>';
    isDarkTheme = true;
}

function enableLightTheme() {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeToggle').innerHTML = '<span class="theme-text">Тёмная тема</span>';
    isDarkTheme = false;
}

function saveTheme() {
    localStorage.setItem('festivalPlannerTheme', isDarkTheme ? 'dark' : 'light');
}

// === ОСНОВНЫЕ ФУНКЦИИ ===

function loadEventsForDay(day) {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    if (festivalEvents[day]) {
        festivalEvents[day].forEach(event => {
            const eventElement = createEventElement(event);
            eventsList.appendChild(eventElement);
        });
    }
    updateEventStates();
}

function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.setAttribute('data-id', event.id);
    
    eventElement.innerHTML = `
        <div class="event-time">${event.time}</div>
        <div class="event-title">${event.title}</div>
        <div class="event-location">${event.location}</div>
    `;
    
    eventElement.addEventListener('click', function() {
        toggleEventSelection(event);
    });
    
    if (selectedEvents.some(selected => selected.id === event.id)) {
        eventElement.classList.add('selected');
    }
    
    return eventElement;
}

function toggleEventSelection(event) {
    const eventIndex = selectedEvents.findIndex(e => e.id === event.id);
    
    if (eventIndex === -1) {
        selectedEvents.push(event);
        document.querySelector(`.event-item[data-id="${event.id}"]`).classList.add('selected');
    } else {
        selectedEvents.splice(eventIndex, 1);
        document.querySelector(`.event-item[data-id="${event.id}"]`).classList.remove('selected');
    }
    
    updateSelectedList();
    updateSelectedCount();
    checkForConflicts();
    
    if (isLiveEditMode && generatedSchedules.length > 0) {
        regenerateCurrentSchedule();
    }
}

function generateSchedules() {
    if (selectedEvents.length === 0) {
        showNotification('Пожалуйста, выберите хотя бы одно событие!', 'warning');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="loading"></span> Генерация маршрутов...';
    generateBtn.disabled = true;
    
    setTimeout(() => {
        generatedSchedules = generateSchedulesAlgorithm(selectedEvents, isLiveEditMode);
        
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
        
        currentScheduleIndex = 0;
        displaySchedule(0);
        updateScheduleTabs();
        updateScheduleStats();
        
        showNotification(`Сгенерировано ${generatedSchedules.length} маршрута!`, 'success');
    }, 800);
}

// === ГРУППОВОЕ ПЛАНИРОВАНИЕ ===

function openGroupModal() {
    document.getElementById('groupModal').classList.add('show');
    renderGroupMembers();
}

function closeGroupModal() {
    document.getElementById('groupModal').classList.remove('show');
}

function renderGroupMembers() {
    const container = document.getElementById('groupMembersContainer');
    container.innerHTML = '';
    
    groupMembers.forEach((member, index) => {
        const memberElement = document.createElement('div');
        memberElement.className = 'group-member';
        memberElement.innerHTML = `
            <input type="text" placeholder="Имя участника" class="member-name" value="${member.name}" data-index="${index}">
            <div class="member-actions">
                <span class="member-events-count">${member.events.length} событий</span>
                <button class="select-events-btn" data-member="${index}">Выбрать</button>
            </div>
        `;
        container.appendChild(memberElement);
        
        // Обработчики для этого участника
        const nameInput = memberElement.querySelector('.member-name');
        const selectBtn = memberElement.querySelector('.select-events-btn');
        
        nameInput.addEventListener('change', function() {
            groupMembers[index].name = this.value;
        });
        
        selectBtn.addEventListener('click', function() {
            selectEventsForMember(index);
        });
    });
}

function addGroupMember() {
    const newMemberId = groupMembers.length;
    groupMembers.push({ 
        name: `Участник ${newMemberId + 1}`, 
        events: [], 
        id: newMemberId 
    });
    renderGroupMembers();
    showNotification('Добавлен новый участник', 'success');
}

function selectEventsForMember(memberIndex) {
    currentMemberEditing = memberIndex;
    const member = groupMembers[memberIndex];
    
    document.getElementById('memberModalTitle').textContent = `Выбор событий для ${member.name}`;
    loadMemberEvents(currentDay);
    document.getElementById('memberEventsModal').classList.add('show');
}

function closeMemberModal() {
    document.getElementById('memberEventsModal').classList.remove('show');
    currentMemberEditing = null;
}

function loadMemberEvents(day) {
    const eventsList = document.getElementById('memberEventsList');
    eventsList.innerHTML = '';
    
    if (festivalEvents[day]) {
        festivalEvents[day].forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'member-event-item';
            eventElement.setAttribute('data-id', event.id);
            
            eventElement.innerHTML = `
                <div class="member-event-time">${event.time}</div>
                <div class="member-event-title">${event.title}</div>
                <div class="member-event-location">${event.location}</div>
            `;
            
            eventElement.addEventListener('click', function() {
                const member = groupMembers[currentMemberEditing];
                const eventIndex = member.events.findIndex(e => e.id === event.id);
                
                if (eventIndex === -1) {
                    member.events.push(event);
                    eventElement.classList.add('selected');
                } else {
                    member.events.splice(eventIndex, 1);
                    eventElement.classList.remove('selected');
                }
                
                updateMemberEventsCount(currentMemberEditing);
            });
            
            if (groupMembers[currentMemberEditing].events.some(e => e.id === event.id)) {
                eventElement.classList.add('selected');
            }
            
            eventsList.appendChild(eventElement);
        });
    }
    
    // Обработчики для переключения дней в модальном окне
    document.querySelectorAll('#memberEventsModal .day-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#memberEventsModal .day-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const day = parseInt(this.getAttribute('data-day'));
            loadMemberEvents(day);
        });
    });
}

function updateMemberEventsCount(memberIndex) {
    const memberElements = document.querySelectorAll('.group-member');
    if (memberElements[memberIndex]) {
        const countElement = memberElements[memberIndex].querySelector('.member-events-count');
        countElement.textContent = `${groupMembers[memberIndex].events.length} событий`;
    }
}

function saveMemberEvents() {
    if (currentMemberEditing !== null) {
        closeMemberModal();
        showNotification(`События для ${groupMembers[currentMemberEditing].name} сохранены!`, 'success');
    }
}

function generateGroupSchedules() {
    // Объединяем события всех участников
    const allGroupEvents = [];
    let hasEvents = false;
    
    groupMembers.forEach(member => {
        if (member.events.length > 0) {
            hasEvents = true;
            allGroupEvents.push(...member.events);
        }
    });
    
    if (!hasEvents) {
        showNotification('Участники не выбрали ни одного события!', 'warning');
        return;
    }
    
    // Убираем дубликаты
    const uniqueEvents = allGroupEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
    );
    
    selectedEvents = uniqueEvents;
    updateSelectedList();
    updateSelectedCount();
    loadEventsForDay(currentDay);
    
    closeGroupModal();
    generateSchedules();
    
    showNotification(`Учтены события ${groupMembers.length} участников!`, 'success');
}

// === РЕЖИМ ФЕСТИВАЛЯ (КОРРЕКТИРОВКА НА ЛЕТУ) ===

function toggleLiveEditMode() {
    isLiveEditMode = !isLiveEditMode;
    const liveEditBtn = document.getElementById('liveEditBtn');
    const groupPlanBtn = document.getElementById('groupPlanBtn');
    
    if (isLiveEditMode) {
        liveEditBtn.classList.add('active');
        groupPlanBtn.classList.remove('active');
        showLiveEditBanner();
        updateCurrentTime();
    } else {
        liveEditBtn.classList.remove('active');
        hideLiveEditBanner();
    }
    
    loadEventsForDay(currentDay);
    if (generatedSchedules.length > 0) {
        displaySchedule(currentScheduleIndex);
    }
    
    showNotification(isLiveEditMode ? 'Режим фестиваля активирован' : 'Режим фестиваля деактивирован', 'success');
}

function toggleGroupPlanMode() {
    const groupPlanBtn = document.getElementById('groupPlanBtn');
    const liveEditBtn = document.getElementById('liveEditBtn');
    
    if (groupPlanBtn.classList.contains('active')) {
        groupPlanBtn.classList.remove('active');
        closeGroupModal();
    } else {
        groupPlanBtn.classList.add('active');
        liveEditBtn.classList.remove('active');
        isLiveEditMode = false;
        hideLiveEditBanner();
        openGroupModal();
    }
}

function showLiveEditBanner() {
    let banner = document.querySelector('.live-edit-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'live-edit-banner';
        document.querySelector('.events-panel').insertBefore(banner, document.querySelector('.day-selector'));
    }
    
    banner.innerHTML = `
        <h4>Режим фестиваля активен</h4>
        <p>Текущее время: <span class="current-time">${formatTimeForDisplay(currentTime)}</span></p>
        <p>Система учитывает прошедшие события и доступное время. Маршруты обновляются автоматически.</p>
    `;
    
    banner.classList.add('show');
}

function hideLiveEditBanner() {
    const banner = document.querySelector('.live-edit-banner');
    if (banner) {
        banner.classList.remove('show');
    }
}

function updateCurrentTime() {
    if (isLiveEditMode) {
        currentTime = new Date();
        const currentTimeElement = document.querySelector('.current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = formatTimeForDisplay(currentTime);
        }
        updateEventStates();
        if (generatedSchedules.length > 0) {
            displaySchedule(currentScheduleIndex);
        }
    }
}

function formatTimeForDisplay(date) {
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// === УЛУЧШЕННАЯ ЛОГИКА ВРЕМЕННЫХ СОСТОЯНИЙ ===

function updateEventStates() {
    if (!isLiveEditMode) {
        // Сбрасываем все состояния если не в режиме фестиваля
        document.querySelectorAll('.event-item').forEach(item => {
            item.classList.remove('past-event', 'current-event', 'future-event');
        });
        return;
    }
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    document.querySelectorAll('.event-item').forEach(item => {
        const eventTime = item.querySelector('.event-time').textContent;
        const [startTime, endTime] = eventTime.split('-');
        const eventStart = getTimeInMinutes(startTime);
        const eventEnd = getTimeInMinutes(endTime);
        
        // Убираем все классы состояний
        item.classList.remove('past-event', 'current-event', 'future-event');
        
        if (eventEnd < currentMinutes) {
            // Прошедшее событие
            item.classList.add('past-event');
        } else if (eventStart <= currentMinutes && eventEnd >= currentMinutes) {
            // Текущее событие
            item.classList.add('current-event');
        } else {
            // Будущее событие
            item.classList.add('future-event');
        }
    });
}

function regenerateCurrentSchedule() {
    if (generatedSchedules.length === 0) return;
    
    const updatedSchedules = generateSchedulesAlgorithm(selectedEvents, isLiveEditMode);
    generatedSchedules[currentScheduleIndex] = updatedSchedules[0];
    
    displaySchedule(currentScheduleIndex);
    updateScheduleStats();
    showNotification('Маршрут обновлён с учётом нового события!', 'success');
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function clearSelectedEvents() {
    selectedEvents = [];
    document.querySelectorAll('.event-item').forEach(item => {
        item.classList.remove('selected');
    });
    updateSelectedList();
    updateSelectedCount();
    checkForConflicts();
    showNotification('Все события очищены', 'success');
}

function filterEvents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const eventItems = document.querySelectorAll('.event-item');
    
    eventItems.forEach(item => {
        const title = item.querySelector('.event-title').textContent.toLowerCase();
        const location = item.querySelector('.event-location').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || location.includes(searchTerm);
        item.style.display = isVisible ? 'block' : 'none';
    });
}

function updateSelectedCount() {
    const selectedCount = document.getElementById('selectedCount');
    selectedCount.textContent = `${selectedEvents.length} событий`;
}

function updateSelectedList() {
    const selectedList = document.getElementById('selectedList');
    selectedList.innerHTML = '';
    
    if (selectedEvents.length === 0) {
        selectedList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--gray); font-style: italic;">Нет выбранных событий</div>';
        return;
    }
    
    selectedEvents.forEach(event => {
        const selectedItem = document.createElement('div');
        selectedItem.className = 'selected-item';
        
        selectedItem.innerHTML = `
            <div style="flex: 1;">
                <div class="event-title">${event.title}</div>
                <div class="event-time" style="font-size: 12px; color: var(--gray);">${event.time} | ${event.location}</div>
            </div>
            <button class="remove-btn" data-id="${event.id}">×</button>
        `;
        
        selectedList.appendChild(selectedItem);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const eventId = parseInt(this.getAttribute('data-id'));
            const eventIndex = selectedEvents.findIndex(e => e.id === eventId);
            
            if (eventIndex !== -1) {
                selectedEvents.splice(eventIndex, 1);
                document.querySelector(`.event-item[data-id="${eventId}"]`).classList.remove('selected');
                updateSelectedList();
                updateSelectedCount();
                checkForConflicts();
                
                if (isLiveEditMode && generatedSchedules.length > 0) {
                    regenerateCurrentSchedule();
                }
            }
        });
    });
}

function checkForConflicts() {
    const conflictWarning = document.getElementById('conflictWarning');
    let hasConflict = false;
    
    const eventsByDay = {};
    selectedEvents.forEach(event => {
        if (!eventsByDay[event.day]) {
            eventsByDay[event.day] = [];
        }
        eventsByDay[event.day].push(event);
    });
    
    for (const day in eventsByDay) {
        const dayEvents = eventsByDay[day];
        
        dayEvents.sort((a, b) => {
            const aStart = getTimeInMinutes(a.time.split('-')[0]);
            const bStart = getTimeInMinutes(b.time.split('-')[0]);
            return aStart - bStart;
        });
        
        for (let i = 0; i < dayEvents.length - 1; i++) {
            const currentEvent = dayEvents[i];
            const nextEvent = dayEvents[i + 1];
            
            const currentEnd = getTimeInMinutes(currentEvent.time.split('-')[1]);
            const nextStart = getTimeInMinutes(nextEvent.time.split('-')[0]);
            
            if (currentEnd > nextStart) {
                hasConflict = true;
                break;
            }
        }
        
        if (hasConflict) break;
    }
    
    if (hasConflict) {
        conflictWarning.classList.add('show');
    } else {
        conflictWarning.classList.remove('show');
    }
    
    return hasConflict;
}

function updateScheduleStats() {
    const scheduleStats = document.getElementById('scheduleStats');
    
    if (generatedSchedules.length === 0) {
        scheduleStats.innerHTML = '';
        return;
    }
    
    const totalEvents = selectedEvents.length;
    const scheduledEvents = generatedSchedules[0] ? 
        Object.values(generatedSchedules[0]).flat().length : 0;
    
    scheduleStats.innerHTML = `
        <div class="schedule-stats-item">
            <span>📊</span>
            ${scheduledEvents}/${totalEvents} событий
        </div>
    `;
}

function updateScheduleTabs() {
    const scheduleTabs = document.getElementById('scheduleTabs');
    scheduleTabs.innerHTML = '';
    
    generatedSchedules.forEach((_, index) => {
        const tab = document.createElement('div');
        tab.className = `schedule-tab ${index === 0 ? 'active' : ''}`;
        tab.setAttribute('data-schedule', index);
        tab.textContent = `Маршрут ${index + 1}`;
        
        tab.addEventListener('click', function() {
            document.querySelectorAll('.schedule-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentScheduleIndex = parseInt(this.getAttribute('data-schedule'));
            displaySchedule(currentScheduleIndex);
        });
        
        scheduleTabs.appendChild(tab);
    });
}

function displaySchedule(scheduleIndex) {
    const scheduleView = document.getElementById('scheduleView');
    scheduleView.innerHTML = '';
    
    if (generatedSchedules.length === 0 || !generatedSchedules[scheduleIndex]) {
        scheduleView.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗺️</div>
                <h3>Создайте ваш первый маршрут</h3>
                <p>Выберите события и нажмите "Сгенерировать маршруты"</p>
            </div>
        `;
        return;
    }
    
    const schedule = generatedSchedules[scheduleIndex];
    let hasEvents = false;
    
    for (const day in schedule) {
        if (schedule[day].length > 0) {
            hasEvents = true;
            const dayElement = document.createElement('div');
            const isCurrentDay = isLiveEditMode && parseInt(day) === getCurrentFestivalDay();
            dayElement.className = `schedule-day ${isCurrentDay ? 'current-day' : ''}`;
            
            const dayTitle = document.createElement('h3');
            dayTitle.className = 'schedule-day-title';
            dayTitle.textContent = `День ${day} ${isCurrentDay ? '(Сегодня)' : ''}`;
            dayElement.appendChild(dayTitle);
            
            const timeSlots = createTimeSlotsForDay(schedule[day], isLiveEditMode);
            timeSlots.forEach(slot => {
                dayElement.appendChild(slot);
            });
            
            scheduleView.appendChild(dayElement);
        }
    }
    
    if (!hasEvents) {
        scheduleView.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😴</div>
                <h3>В этом маршруте нет событий</h3>
                <p>Попробуйте другой вариант маршрута</p>
            </div>
        `;
    }
}

function getCurrentFestivalDay() {
    return currentDay;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.background = type === 'success' ? 'var(--success)' : 
                                  type === 'warning' ? 'var(--warning)' : 'var(--primary)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === ФУНКЦИИ ДЛЯ РАБОТЫ СО ВРЕМЕНЕМ ===

function getTimeInMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function createTimeSlotsForDay(dayEvents, isLiveEditMode = false) {
    const slots = [];
    const currentTimeMinutes = isLiveEditMode ? 
        (new Date().getHours() * 60 + new Date().getMinutes()) : 9 * 60;
    let currentTime = isLiveEditMode ? currentTimeMinutes : 9 * 60;
    
    dayEvents.sort((a, b) => {
        const aStart = getTimeInMinutes(a.time.split('-')[0]);
        const bStart = getTimeInMinutes(b.time.split('-')[0]);
        return aStart - bStart;
    });
    
    dayEvents.forEach(event => {
        const eventStart = getTimeInMinutes(event.time.split('-')[0]);
        const eventEnd = getTimeInMinutes(event.time.split('-')[1]);
        
        if (currentTime < eventStart) {
            const freeTimeSlot = document.createElement('div');
            const isPast = isLiveEditMode && eventStart < currentTimeMinutes;
            freeTimeSlot.className = `time-slot ${isPast ? 'past-slot' : 'future-slot'}`;
            
            const freeTimeLabel = document.createElement('div');
            freeTimeLabel.className = 'time-label';
            freeTimeLabel.textContent = formatTime(currentTime) + '-' + formatTime(eventStart);
            
            const freeTimeContent = document.createElement('div');
            freeTimeContent.className = 'empty-slot';
            freeTimeContent.textContent = 'Свободное время';
            
            freeTimeSlot.appendChild(freeTimeLabel);
            freeTimeSlot.appendChild(freeTimeContent);
            slots.push(freeTimeSlot);
        }
        
        const eventSlot = document.createElement('div');
        let timeStatus = 'future-slot';
        
        if (isLiveEditMode) {
            if (eventEnd < currentTimeMinutes) {
                timeStatus = 'past-slot';
            } else if (eventStart <= currentTimeMinutes && eventEnd >= currentTimeMinutes) {
                timeStatus = 'current-slot';
            }
        }
        
        eventSlot.className = `time-slot ${timeStatus}`;
        
        const eventTimeLabel = document.createElement('div');
        eventTimeLabel.className = 'time-label';
        eventTimeLabel.textContent = event.time;
        
        const eventContent = document.createElement('div');
        eventContent.className = 'event-slot';
        eventContent.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-location">${event.location}</div>
        `;
        
        eventSlot.appendChild(eventTimeLabel);
        eventSlot.appendChild(eventContent);
        slots.push(eventSlot);
        
        currentTime = eventEnd;
    });
    
    const endOfDay = 22 * 60;
    if (currentTime < endOfDay) {
        const freeTimeSlot = document.createElement('div');
        const isPast = isLiveEditMode && endOfDay < currentTimeMinutes;
        freeTimeSlot.className = `time-slot ${isPast ? 'past-slot' : 'future-slot'}`;
        
        const freeTimeLabel = document.createElement('div');
        freeTimeLabel.className = 'time-label';
        freeTimeLabel.textContent = formatTime(currentTime) + '-' + formatTime(endOfDay);
        
        const freeTimeContent = document.createElement('div');
        freeTimeContent.className = 'empty-slot';
        freeTimeContent.textContent = 'Свободное время';
        
        freeTimeSlot.appendChild(freeTimeLabel);
        freeTimeSlot.appendChild(freeTimeContent);
        slots.push(freeTimeSlot);
    }
    
    return slots;
}