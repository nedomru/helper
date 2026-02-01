/**
 * Calculates and displays client's age next to birth date in client info tab
 */

// Calculate age from birth date string (format: DD.MM.YYYY)
function calculateAge(birthDateStr: string): number {
    const [day, month, year] = birthDateStr.split(".").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
}

// Get correct age form in Russian
function getAgeForm(age: number): string {
    const lastTwo = age % 100;
    const lastOne = age % 10;

    if (lastTwo >= 11 && lastTwo <= 19) {
        return "лет";
    }

    switch (lastOne) {
        case 1:
            return "год";
        case 2:
        case 3:
        case 4:
            return "года";
        default:
            return "лет";
    }
}

/**
 * Finds birth date in client info table and adds age calculation
 */
export async function showClientAge(): Promise<void> {
    // Find all table rows with birth date
    const rows = document.querySelectorAll<HTMLTableRowElement>("tr");
    let totalProcessed = 0;

    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
            const label = cells[0].textContent?.trim();
            const dateCell = cells[1];

            if (label === "Дата рождения") {
                const dateText = dateCell.textContent?.trim();
                if (dateText && /^\d{2}\.\d{2}\.\d{4}$/.test(dateText)) {
                    // Check if age is already displayed
                    if (!dateCell.textContent?.includes("(")) {
                        const age = calculateAge(dateText);
                        const ageForm = getAgeForm(age);
                        dateCell.textContent = `${dateText} (${age} ${ageForm})`;
                        totalProcessed++;
                    }
                }
            }
        }
    });
}
