/**
 * Date validation utilities for compensation feature
 */

// Regex for date format DD.MM
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])$/;

/**
 * Gets the current year
 */
export function getCurrentYear(): number {
    return new Date().getFullYear();
}

/**
 * Validates if a string is a date in DD.MM format and is a real day of the month/year.
 * @param dateString - The date string in DD.MM format.
 * @param currentYear - The year to validate against (defaults to current year).
 * @returns True if the date is valid, false otherwise.
 */
export function isValidDate(dateString: string, currentYear: number = getCurrentYear()): boolean {
    if (!DATE_REGEX.test(dateString)) return false;

    const [day, month] = dateString.split(".").map(Number);
    const date = new Date(currentYear, month - 1, day);

    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === currentYear;
}

/**
 * Formats a DD.MM string into a DD.MM.YYYY string using the specified year.
 * @param dateString - The date string in DD.MM format.
 * @param year - The year to use (defaults to current year).
 * @returns The date string in DD.MM.YYYY format.
 */
export function formatDateWithYear(dateString: string, year: number = getCurrentYear()): string {
    return `${dateString}.${year}`;
}

/**
 * Generates an array of dates (DD.MM.YYYY strings) between a start and end date (inclusive).
 * @param startDate - The start date in DD.MM.YYYY format.
 * @param endDate - The end date in DD.MM.YYYY format.
 * @returns An array of date strings.
 */
export function getDatesArray(startDate: string, endDate: string): string[] {
    const dates: string[] = [];

    const parseDateString = (dateStr: string): Date => {
        const [day, month, year] = dateStr.split(".").map(Number);
        return new Date(year, month - 1, day);
    };

    const currentDate = parseDateString(startDate);
    const lastDate = parseDateString(endDate);

    currentDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    while (currentDate <= lastDate) {
        dates.push(currentDate.toLocaleDateString("ru-RU", {
            day: "2-digit", month: "2-digit", year: "numeric",
        }));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

/**
 * Parses a DD.MM.YYYY string into a Date object
 */
export function parseDateString(dateStr: string): Date {
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Gets the current day in DD.MM format
 */
export function getCurrentDay(): string {
    const currentDate = new Date();
    const day: string = String(currentDate.getDate()).padStart(2, "0");
    const month: string = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}`;
}
