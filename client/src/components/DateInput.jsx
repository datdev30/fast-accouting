import React, { useState, useEffect } from 'react';
import { toDisplayDate, parseDate, isValidDate } from '../utils/dateUtils';

const DateInput = ({ value, onChange, className, required, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Sync internal state with external value (yyyy-mm-dd -> dd/mm/yyyy)
        if (value) {
            setDisplayValue(toDisplayDate(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e) => {
        let inputValue = e.target.value;

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
        // On blur, if invalid, maybe revert or clear? 
        // For now, let's just leave it. If it's invalid, parent 'value' won't update, 
        // so it might snap back if we are strictly controlled by useEffect.
        // But users might struggle if they type partial dates.
        // Let's rely on isValidDate check in handleChange.
        if (displayValue.length === 10 && !isValidDate(displayValue)) {
            // Optional: visual feedback
            // alert('Ngày không hợp lệ');
        }
    };

    return (
        <input
            {...props}
            type="text"
            placeholder="dd/mm/yyyy"
            //            maxLength={10}
            className={className}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
        />
    );
};

export default DateInput;
