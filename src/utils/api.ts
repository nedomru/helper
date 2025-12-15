interface MNAProvider {
    name: string;
    link: string;
    authorization: string;
    connection: string;
}

interface MNAData {
    mna: MNAProvider[];
}

interface Router {
    Name: string;
    PPPoE: string | string[];
    DHCP: string | string[];
    IPoE: string | string[];
    Channels: string | string[];
    Settings: string;
    KnowledgeBase: string | string[];
    Emulator: string | string[];
}

interface RoutersData {
    routers: Router[];
}

export type {MNAProvider, MNAData, Router, RoutersData};

export async function fetchFromAPI<T>(url: string): Promise<T> {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
    }
}

export async function fetchMNAData(): Promise<MNAData> {
    return fetchFromAPI<MNAData>("https://helper.chrsnv.ru/api/mna.json");
}

export async function fetchRoutersData(): Promise<RoutersData> {
    return fetchFromAPI<RoutersData>("https://helper.chrsnv.ru/api/routers.json");
}
