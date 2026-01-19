import React, { useState, useEffect } from 'react';
import { toDisplayDate, parseDate, isValidDate } from '../utils/dateUtils';
import { clsx } from 'clsx';

const DateInput = ({ value, onChange, className, required, showError = true, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isInvalid, setIsInvalid] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Sync internal state with external value (yyyy-mm-dd -> dd/mm/yyyy)
        if (value) {
            setDisplayValue(toDisplayDate(value));
            setIsInvalid(false);
            setErrorMessage('');
        } else {
            setDisplayValue('');
            setIsInvalid(false);
            setErrorMessage('');
        }
    }, [value]);

    const handleChange = (e) => {
        let inputValue = e.target.value;

        // Clear error when user starts typing
        if (isInvalid) {
            setIsInvalid(false);
            setErrorMessage('');
        }

        // Allow user to empty the field
        if (inputValue === '') {
            setDisplayValue('');
            onChange({ target: { value: '' } });
            return;
        }

        // Basic masking logic: auto-insert slashes
        // Remove non-digit characters to re-process
        const numbers = inputValue.replace(/\D/g, '');

        // Limit to 8 digits (ddmmyyyy)
        if (numbers.length > 8) return;

        let formatted = numbers;
        if (numbers.length >= 3) {
            formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
        }
        if (numbers.length >= 5) {
            formatted = `${formatted.slice(0, 5)}/${formatted.slice(5)}`;
        }

        setDisplayValue(formatted);

        // If it looks like a full date, try to update parent
        if (formatted.length === 10 && isValidDate(formatted)) {
            onChange({ target: { value: parseDate(formatted) } });
        }
    };

    const handleBlur = () => {
        // On blur, validate the date
        if (displayValue.length > 0 && displayValue.length < 10) {
            setIsInvalid(true);
            setErrorMessage('Ngày chưa đầy đủ (dd/mm/yyyy)');
        } else if (displayValue.length === 10 && !isValidDate(displayValue)) {
            setIsInvalid(true);
            setErrorMessage('Ngày không hợp lệ (dd/mm/yyyy)');
        }
    };

    const inputClassName = clsx(
        className,
        isInvalid && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    );

    return (
        <div className="w-full">
            <input
                {...props}
                type="text"
                placeholder="dd/mm/yyyy"
                className={inputClassName}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                required={required}
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? 'date-error' : undefined}
            />
            {isInvalid && showError && (
                <p id="date-error" className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errorMessage}
                </p>
            )}
        </div>
    );
};

export default DateInput;
