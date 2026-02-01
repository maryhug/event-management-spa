import { formatDate, capacityPercentage, daysUntilEvent } from '../utils/helpers.js';

export function createEventCard(event) {
    const capacity = capacityPercentage(event.currentAttendees, event.maxCapacity);
    const isFull = event.currentAttendees >= event.maxCapacity;
    const daysUntil = daysUntilEvent(event.date);

    // Determine status badge
    let statusBadge = '';
    if (isFull) {
        statusBadge = '<span class="badge badge-danger">Full</span>';
    } else if (capacity >= 80) {
        statusBadge = '<span class="badge badge-warning">Almost Full</span>';
    } else if (daysUntil <= 7 && daysUntil >= 0) {
        statusBadge = '<span class="badge badge-info">Coming Soon</span>';
    } else if (daysUntil < 0) {
        statusBadge = '<span class="badge badge-secondary">Past Event</span>';
    }

    // Capacity bar color
    let capacityColor = '#4CAF50';
    if (capacity >= 90) {
        capacityColor = '#f44336';
    } else if (capacity >= 70) {
        capacityColor = '#ff9800';
    }

    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-card-header">
                <span class="event-category category-${event.category}">${event.category}</span>
                ${statusBadge}
            </div>
            
            <div class="event-card-image">
                <div class="event-image-placeholder">${getEventIcon(event.category)}</div>
            </div>
            
            <div class="event-card-body">
                <h3 class="event-title">${event.name}</h3>
                <p class="event-description">${truncateText(event.description, 100)}</p>
                
                <div class="event-details">
                    <div class="event-detail">
                        <span class="detail-icon">📅</span>
                        <span class="detail-text">${formatDate(event.date)}</span>
                    </div>
                    
                    <div class="event-detail">
                        <span class="detail-icon">📍</span>
                        <span class="detail-text">${event.location}</span>
                    </div>
                    
                    <div class="event-detail">
                        <span class="detail-icon">👥</span>
                        <span class="detail-text">${event.currentAttendees}/${event.maxCapacity} attendees</span>
                    </div>
                </div>
                
                <div class="capacity-section">
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: ${capacity}%; background-color: ${capacityColor}"></div>
                    </div>
                    <p class="capacity-text">${capacity}% capacity</p>
                </div>
            </div>
            
            <div class="event-card-footer">
                <button 
                    class="btn ${isFull ? 'btn-secondary' : 'btn-primary'} btn-block btn-register" 
                    data-event-id="${event.id}"
                    ${isFull ? 'disabled' : ''}
                >
                    ${isFull ? '🚫 Event Full' : '✅ Register Now'}
                </button>
            </div>
        </div>
    `;
}

function getEventIcon(category) {
    const icons = {
        technology: '💻',
        workshop: '🛠️',
        conference: '🎤',
        networking: '🤝',
        default: '📅'
    };
    return icons[category] || icons.default;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
