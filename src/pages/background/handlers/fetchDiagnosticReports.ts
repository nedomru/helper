import type {DiagnosticFile, FetchDiagnosticReportsMessage, Response,} from "../types";

/**
 * Parses nginx directory listing HTML to extract file names
 */
function parseNginxDirectoryListing(html: string, baseUrl: string, source: string): DiagnosticFile[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = doc.querySelectorAll("a");

    const files: DiagnosticFile[] = [];

    for (const link of links) {
        const href = link.getAttribute("href");
        const fileName = link.textContent?.trim();

        // Skip parent directory link and empty entries
        if (!href || !fileName || href === "../" || href.startsWith("/")) {
            continue;
        }

        // Skip directories (typically ending with /)
        if (href.endsWith("/")) {
            continue;
        }

        files.push({
            name: fileName,
            url: `${baseUrl}${href}`,
            source,
        });
    }

    return files;
}

/**
 * Fetches files from a single diagnostic results directory
 */
async function fetchDiagnosticFiles(url: string, source: string): Promise<DiagnosticFile[]> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch ${source}: HTTP ${response.status}`);
            return [];
        }

        const html = await response.text();
        return parseNginxDirectoryListing(html, url, source);
    } catch (error) {
        console.error(`Error fetching ${source}:`, error);
        return [];
    }
}

/**
 * Handles fetching diagnostic reports from both mobile and perm sources
 */
export async function handleFetchDiagnosticReports(
    message: FetchDiagnosticReportsMessage,
): Promise<Response<DiagnosticFile[]>> {
    try {
        const {urls} = message.payload;

        if (!urls || urls.length !== 2) {
            return {ok: false, err: "Expected exactly 2 URLs (mobile and perm)"};
        }

        const [mobileUrl, permUrl] = urls;

        // Fetch from both sources in parallel
        const [mobileFiles, permFiles] = await Promise.all([
            fetchDiagnosticFiles(mobileUrl, "mobile"),
            fetchDiagnosticFiles(permUrl, "perm"),
        ]);

        const allFiles = [...mobileFiles, ...permFiles];

        if (allFiles.length === 0) {
            return {ok: true, data: []};
        }

        return {ok: true, data: allFiles};
    } catch (error) {
        console.error("Error handling diagnostic reports fetch:", error);
        return {ok: false, err: String(error)};
    }
}
