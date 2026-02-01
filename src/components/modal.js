export function createModal(options = {}) {
    const {
        id = 'modal',
        title = 'Modal',
        content = '',
        showCloseButton = true,
        size = 'medium' // small, medium, large
    } = options;

    return `
        <div id="${id}" class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-container modal-${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        ${showCloseButton ? '<button class="modal-close" data-modal-close>&times;</button>' : ''}
                    </div>
                    
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Add close listeners
        attachModalCloseListeners(modalId);
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function attachModalCloseListeners(modalId) {
    const modal = document.getElementById(modalId);

    // Close button
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => hideModal(modalId));
    }

    // Click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
            hideModal(modalId);
        }
    });

    // Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            hideModal(modalId);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

export function createConfirmModal(message, onConfirm, onCancel) {
    const content = `
        <p class="confirm-message">${message}</p>
        <div class="modal-actions">
            <button class="btn btn-secondary" data-modal-close>Cancel</button>
            <button class="btn btn-danger" id="confirmBtn">Confirm</button>
        </div>
    `;

    const modalHTML = createModal({
        id: 'confirmModal',
        title: 'Confirm Action',
        content: content,
        size: 'small'
    });

    // Insert modal if it doesn't exist
    if (!document.getElementById('confirmModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showModal('confirmModal');

    // Attach confirm listener
    document.getElementById('confirmBtn').addEventListener('click', () => {
        if (onConfirm) onConfirm();
        hideModal('confirmModal');
    });

    // Attach cancel listener
    const cancelBtn = document.querySelector('[data-modal-close]');
    if (cancelBtn && onCancel) {
        cancelBtn.addEventListener('click', onCancel);
    }
}
