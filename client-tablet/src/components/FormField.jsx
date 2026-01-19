import React from 'react';

/**
 * FormField Component
 * Wrapper for form inputs with label, error, and helper text
 * Follows UX Guidelines #44, #54, #55, #59: Proper form field structure
 */

const FormField = ({
    label,
    name,
    required = false,
    error,
    helperText,
    children,
    className = '',
}) => {
    const fieldId = name || `field-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={fieldId}
                    className={`field-label ${required ? 'field-label-required' : ''}`}
                >
                    {label}
                </label>
            )}

            {/* Clone children and add id and aria attributes */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        id: fieldId,
                        name: name || fieldId,
                        'aria-invalid': error ? 'true' : 'false',
                        'aria-describedby': error
                            ? `${fieldId}-error`
                            : helperText
                                ? `${fieldId}-helper`
                                : undefined,
                        className: `${child.props.className || ''} ${error ? 'input-error' : ''}`.trim(),
                    });
                }
                return child;
            })}

            {error && (
                <div id={`${fieldId}-error`} className="field-error" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {!error && helperText && (
                <div id={`${fieldId}-helper`} className="field-helper">
                    {helperText}
                </div>
            )}
        </div>
    );
};

export default FormField;
