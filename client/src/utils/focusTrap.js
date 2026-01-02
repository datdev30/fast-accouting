/**
 * Focus Trap Utilities
 * Helps manage focus within modal dialogs for accessibility
 */

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - The container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function getFocusableElements(container) {
    if (!container) return [];

    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Trap focus within a container (for modals)
 * @param {HTMLElement} container - The container element
 * @param {KeyboardEvent} event - The keyboard event
 */
export function trapFocus(container, event) {
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift+tab on first element, go to last
    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    }
    // If tab on last element, go to first
    else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

/**
 * Focus the first focusable element in a container
 * @param {HTMLElement} container - The container element
 */
export function focusFirstElement(container) {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

/**
 * Store and restore focus for modal dialogs
 */
export class FocusManager {
    constructor() {
        this.previousElement = null;
    }

    /**
     * Save the currently focused element
     */
    saveFocus() {
        this.previousElement = document.activeElement;
    }

    /**
     * Restore focus to the previously focused element
     */
    restoreFocus() {
        if (this.previousElement && this.previousElement.focus) {
            this.previousElement.focus();
        }
    }
}
