/**
 * Accessibility Utilities
 * Helper functions for improving accessibility
 * Follows WCAG 2.1 guidelines and UX best practices
 */

/**
 * Announce message to screen readers using live region
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
    const liveRegion = document.getElementById('a11y-live-region') || createLiveRegion();
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
        liveRegion.textContent = '';
    }, 1000);
};

/**
 * Create live region for screen reader announcements
 */
const createLiveRegion = () => {
    const region = document.createElement('div');
    region.id = 'a11y-live-region';
    region.className = 'live-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
};

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export const getFocusableElements = (container) => {
    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Get first focusable element in container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement|null} First focusable element or null
 */
export const getFirstFocusableElement = (container) => {
    const elements = getFocusableElements(container);
    return elements[0] || null;
};

/**
 * Get last focusable element in container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement|null} Last focusable element or null
 */
export const getLastFocusableElement = (container) => {
    const elements = getFocusableElements(container);
    return elements[elements.length - 1] || null;
};

/**
 * Trap focus within a container (for modals, dialogs)
 * @param {HTMLElement} container - Container to trap focus in
 * @returns {Function} Cleanup function to remove trap
 */
export const trapFocus = (container) => {
    const firstFocusable = getFirstFocusableElement(container);
    const lastFocusable = getLastFocusableElement(container);

    const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        // Shift + Tab
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        }
        // Tab
        else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstFocusable?.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * Handle Escape key press
 * @param {Function} callback - Function to call when Escape is pressed
 * @returns {Function} Cleanup function to remove listener
 */
export const handleEscapeKey = (callback) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            callback(e);
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * Prevent body scroll (for modals)
 * @returns {Function} Cleanup function to restore scroll
 */
export const preventBodyScroll = () => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Prevent scroll and compensate for scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
    };
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Generate unique ID for accessibility
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateA11yId = (prefix = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check color contrast ratio
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio
 */
export const getContrastRatio = (foreground, background) => {
    const getLuminance = (hex) => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = ((rgb >> 16) & 0xff) / 255;
        const g = ((rgb >> 8) & 0xff) / 255;
        const b = (rgb & 0xff) / 255;

        const [rs, gs, bs] = [r, g, b].map(c =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG standards
 * @param {number} ratio - Contrast ratio
 * @param {string} level - 'AA' or 'AAA'
 * @param {boolean} largeText - Is text large (18pt+ or 14pt+ bold)
 * @returns {boolean} True if meets standard
 */
export const meetsContrastStandard = (ratio, level = 'AA', largeText = false) => {
    if (level === 'AAA') {
        return largeText ? ratio >= 4.5 : ratio >= 7;
    }
    return largeText ? ratio >= 3 : ratio >= 4.5;
};

export default {
    announceToScreenReader,
    getFocusableElements,
    getFirstFocusableElement,
    getLastFocusableElement,
    trapFocus,
    handleEscapeKey,
    preventBodyScroll,
    prefersReducedMotion,
    generateA11yId,
    getContrastRatio,
    meetsContrastStandard,
};
