/**
 * Keyboard Navigation Utilities
 * Helpers for implementing keyboard navigation in dropdowns, comboboxes, etc.
 */

/**
 * Handle arrow key navigation in a list
 * @param {Array} items - Array of items
 * @param {number} currentIndex - Current selected index
 * @param {string} direction - 'up' or 'down'
 * @returns {number} New index
 */
export function handleArrowNavigation(items, currentIndex, direction) {
    if (!items || items.length === 0) return -1;

    if (direction === 'down') {
        return currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else if (direction === 'up') {
        return currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }

    return currentIndex;
}

/**
 * Handle Enter key selection
 * @param {*} selectedItem - The selected item
 * @param {Function} callback - Callback function to execute
 */
export function handleEnterKey(selectedItem, callback) {
    if (selectedItem && callback) {
        callback(selectedItem);
    }
}

/**
 * Handle Escape key
 * @param {Function} callback - Callback function to execute
 */
export function handleEscKey(callback) {
    if (callback) {
        callback();
    }
}

/**
 * Keyboard event handler for dropdown/combobox
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items
 * @param {number} options.selectedIndex - Current selected index
 * @param {Function} options.onSelect - Callback when item is selected
 * @param {Function} options.onClose - Callback when dropdown should close
 * @param {Function} options.onNavigate - Callback when navigation occurs
 * @returns {boolean} Whether the event was handled
 */
export function handleComboboxKeyboard(event, options) {
    const { items, selectedIndex, onSelect, onClose, onNavigate } = options;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            const nextIndex = handleArrowNavigation(items, selectedIndex, 'down');
            if (onNavigate) onNavigate(nextIndex);
            return true;

        case 'ArrowUp':
            event.preventDefault();
            const prevIndex = handleArrowNavigation(items, selectedIndex, 'up');
            if (onNavigate) onNavigate(prevIndex);
            return true;

        case 'Enter':
            event.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                handleEnterKey(items[selectedIndex], onSelect);
            }
            return true;

        case 'Escape':
            event.preventDefault();
            handleEscKey(onClose);
            return true;

        default:
            return false;
    }
}
