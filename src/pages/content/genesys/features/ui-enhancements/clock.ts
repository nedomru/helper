/**
 * Real-time clock display for Genesys.
 * Shows current time with hours, minutes, and seconds.
 * Click to toggle milliseconds display.
 */

// Singleton flag to prevent multiple initializations
let isInitialized = false;
let updateInterval: number | null = null;
let showMilliseconds = false;

export async function showClock(): Promise<void> {
    // Prevent multiple initializations
    if (isInitialized) return;
    isInitialized = true;

    await addClockElement();
    startClockUpdate();
}

function addClockElement(): Promise<void> {
    return new Promise((resolve) => {
        if (document.querySelector('#helper-clock')) {
            resolve();
            return;
        }

        const observer = new MutationObserver(() => {
            const agentInfoNav = document.querySelector('.application-menus ul.nav.agent-info');

            if (!agentInfoNav) return;

            const clockContainer = document.createElement('li');
            clockContainer.id = 'helper-clock';
            Object.assign(clockContainer.style, {
                padding: '4px 12px',
                margin: '0 10px 0 0',
                fontSize: '16px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: '600',
                border: '2px solid rgba(108, 123, 127, 0.5)',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(52, 64, 75, 0.95) 0%, rgba(40, 48, 58, 0.95) 100%)',
                color: '#ffffff',
                display: 'inline-block',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                userSelect: 'none',
                verticalAlign: 'middle',
                listStyle: 'none',
                position: 'relative'
            });

            const clockElement = document.createElement('span');
            clockElement.id = 'helper-clock-time';
            clockElement.textContent = formatTime(new Date());

            clockContainer.appendChild(clockElement);

            // Insert before the first list item in the nav
            agentInfoNav.insertBefore(clockContainer, agentInfoNav.firstChild);

            // Add hover effect
            clockContainer.onmouseover = () => {
                clockContainer.style.transform = 'translateY(-1px)';
                clockContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                clockContainer.style.borderColor = 'rgba(148, 163, 167, 0.7)';
            };

            clockContainer.onmouseout = () => {
                clockContainer.style.transform = 'translateY(0)';
                clockContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                clockContainer.style.borderColor = 'rgba(108, 123, 127, 0.5)';
            };

            // Add click handler to toggle milliseconds
            clockContainer.onclick = () => {
                showMilliseconds = !showMilliseconds;
                updateClock();

                // Visual feedback
                clockContainer.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    clockContainer.style.transform = '';
                }, 100);

                // Restart update loop with new interval
                if (updateInterval !== null) {
                    cancelAnimationFrame(updateInterval);
                }
                startClockUpdate();
            };

            observer.disconnect();
            resolve();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function startClockUpdate(): void {
    // Update immediately
    updateClock();

    // Update interval depends on whether we show milliseconds
    const updateIntervalMs = showMilliseconds ? 16 : 1000; // ~60fps for milliseconds, 1s otherwise

    let lastUpdate = performance.now();

    function tick(currentTime: number) {
        const elapsed = currentTime - lastUpdate;

        if (elapsed >= updateIntervalMs) {
            updateClock();
            lastUpdate = currentTime;
        }

        // Schedule next update
        updateInterval = requestAnimationFrame(tick) as unknown as number;
    }

    updateInterval = requestAnimationFrame(tick) as unknown as number;
}

function updateClock(): void {
    const clockElement = document.querySelector<HTMLElement>('#helper-clock-time');
    if (!clockElement) return;

    const now = new Date();
    clockElement.textContent = formatTime(now, showMilliseconds);
}

function formatTime(date: Date, includeMs = false): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    if (includeMs) {
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Cleanup function to stop the clock and remove the element
 */
export function cleanupClock(): void {
    if (updateInterval !== null) {
        cancelAnimationFrame(updateInterval);
        updateInterval = null;
    }

    const clockElement = document.querySelector('#helper-clock');
    clockElement?.remove();

    isInitialized = false;
}
