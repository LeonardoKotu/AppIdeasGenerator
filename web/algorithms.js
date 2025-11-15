function getTimeInMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function hasTimeConflict(event1, event2) {
    const [start1, end1] = event1.time.split('-').map(getTimeInMinutes);
    const [start2, end2] = event2.time.split('-').map(getTimeInMinutes);
    
    return (start1 < end2 && start2 < end1);
}

function calculateTravelTime(location1, location2) {
    const travelTimes = {
        'Главная сцена-Сцена 2': 5,
        'Главная сцена-Палатка мастер-классов': 8,
        'Главная сцена-Фудкорт': 10,
        'Главная сцена-Выставочный зал': 12,
        'Главная сцена-Джаз-клуб': 15,
        'Главная сцена-Главная площадь': 3,
        'Сцена 2-Палатка мастер-классов': 7,
        'Сцена 2-Фудкорт': 12,
        'Сцена 2-Выставочный зал': 10,
        'Палатка мастер-классов-Фудкорт': 5,
        'Фудкорт-Выставочный зал': 8
    };
    
    const key1 = `${location1}-${location2}`;
    const key2 = `${location2}-${location1}`;
    return travelTimes[key1] || travelTimes[key2] || 10;
}

function generateSchedulesAlgorithm(selectedEvents) {
    const schedules = [];
    
    const eventsByDay = {};
    selectedEvents.forEach(event => {
        if (!eventsByDay[event.day]) {
            eventsByDay[event.day] = [];
        }
        eventsByDay[event.day].push(event);
    });
    
    for (let variant = 0; variant < 3; variant++) {
        const schedule = {};
        
        for (const day in eventsByDay) {
            let dayEvents = [...eventsByDay[day]];
            
            if (variant === 0) {
                dayEvents.sort((a, b) => {
                    const aStart = getTimeInMinutes(a.time.split('-')[0]);
                    const bStart = getTimeInMinutes(b.time.split('-')[0]);
                    return aStart - bStart;
                });
            } else if (variant === 1) {
                dayEvents.sort((a, b) => {
                    const aDuration = getTimeInMinutes(a.time.split('-')[1]) - getTimeInMinutes(a.time.split('-')[0]);
                    const bDuration = getTimeInMinutes(b.time.split('-')[1]) - getTimeInMinutes(b.time.split('-')[0]);
                    return bDuration - aDuration;
                });
            } else {
                dayEvents.sort((a, b) => {
                    const aPriority = ['церемония', 'концерт', 'шоу'].includes(a.type) ? 1 : 0;
                    const bPriority = ['церемония', 'концерт', 'шоу'].includes(b.type) ? 1 : 0;
                    return bPriority - aPriority;
                });
            }
            
            const validSchedule = [];
            let lastEventEnd = 9 * 60;
            let lastLocation = null;
            
            for (const event of dayEvents) {
                const eventStart = getTimeInMinutes(event.time.split('-')[0]);
                const eventEnd = getTimeInMinutes(event.time.split('-')[1]);
                
                let adjustedStart = eventStart;
                if (lastLocation && lastLocation !== event.location) {
                    const travelTime = calculateTravelTime(lastLocation, event.location);
                    adjustedStart = Math.max(eventStart, lastEventEnd + travelTime);
                }
                
                if (adjustedStart < eventEnd) {
                    let canAdd = true;
                    
                    for (const addedEvent of validSchedule) {
                        if (hasTimeConflict({...event, time: `${formatTime(adjustedStart)}-${event.time.split('-')[1]}`}, addedEvent)) {
                            canAdd = false;
                            break;
                        }
                    }
                    
                    if (canAdd && adjustedStart >= lastEventEnd) {
                        validSchedule.push({
                            ...event,
                            time: `${formatTime(adjustedStart)}-${event.time.split('-')[1]}`
                        });
                        lastEventEnd = eventEnd;
                        lastLocation = event.location;
                    }
                }
            }
            
            schedule[day] = validSchedule;
        }
        
        schedules.push(schedule);
    }
    
    return schedules;
}

function createTimeSlotsForDay(dayEvents) {
    const slots = [];
    let currentTime = 9 * 60;
    
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
            freeTimeSlot.className = 'time-slot';
            
            const freeTimeLabel = document.createElement('div');
            freeTimeLabel.className = 'time-label';
            freeTimeLabel.textContent = formatTime(currentTime) + '-' + formatTime(eventStart);
            
            const freeTimeContent = document.createElement('div');
            freeTimeContent.className = 'empty-slot';
            freeTimeContent.innerHTML = '🕒 Свободное время';
            
            freeTimeSlot.appendChild(freeTimeLabel);
            freeTimeSlot.appendChild(freeTimeContent);
            slots.push(freeTimeSlot);
        }
        
        const eventSlot = document.createElement('div');
        eventSlot.className = 'time-slot';
        
        const eventTimeLabel = document.createElement('div');
        eventTimeLabel.className = 'time-label';
        eventTimeLabel.textContent = event.time;
        
        const eventContent = document.createElement('div');
        eventContent.className = 'event-slot';
        eventContent.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-location">📍 ${event.location}</div>
        `;
        
        eventSlot.appendChild(eventTimeLabel);
        eventSlot.appendChild(eventContent);
        slots.push(eventSlot);
        
        currentTime = eventEnd;
    });
    
    const endOfDay = 22 * 60;
    if (currentTime < endOfDay) {
        const freeTimeSlot = document.createElement('div');
        freeTimeSlot.className = 'time-slot';
        
        const freeTimeLabel = document.createElement('div');
        freeTimeLabel.className = 'time-label';
        freeTimeLabel.textContent = formatTime(currentTime) + '-' + formatTime(endOfDay);
        
        const freeTimeContent = document.createElement('div');
        freeTimeContent.className = 'empty-slot';
        freeTimeContent.innerHTML = '🕒 Свободное время';
        
        freeTimeSlot.appendChild(freeTimeLabel);
        freeTimeSlot.appendChild(freeTimeContent);
        slots.push(freeTimeSlot);
    }
    
    return slots;
}