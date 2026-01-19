export const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const parseDate = (dmyString) => {
    if (!dmyString) return '';
    const parts = dmyString.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    if (!day || !month || !year) return '';
    return `${year}-${month}-${day}`;
};

export const toDisplayDate = (ymdString) => {
    if (!ymdString) return '';
    const parts = ymdString.split('-'); // yyyy-mm-dd
    if (parts.length !== 3) return ymdString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};

export const isValidDate = (dmyString) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dmyString)) return false;
    const [day, month, year] = dmyString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
