/**
 * Creates a draggable, resizable iframe window with window controls
 */
export function createIframeWindow(url: string, title: string): void {
    const container = document.createElement("div");
    container.className = "appeal-iframe-container";
    Object.assign(container.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "900px",
        height: "700px",
        minWidth: "300px",
        minHeight: "200px",
        background: "white",
        border: "1px solid #aaa",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        zIndex: "10000",
        display: "flex",
        flexDirection: "column",
        resize: "both",
        overflow: "hidden",
    });

    let isDragging = false;
    let isMaximized = false;
    let isMinimized = false;
    let dragOffset = {x: 0, y: 0};
    let originalState = {
        top: "",
        left: "",
        width: "",
        height: "",
        transform: "",
    };

    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "8px 12px",
        background: "#2071c2",
        borderBottom: "1px solid #1a5c9e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "move",
        borderRadius: "8px 8px 0 0",
        userSelect: "none",
    });

    const createButton = (
        icon: string,
        title: string,
        onClick: () => void,
        hoverColor: string = "rgba(255,255,255,0.2)",
    ) => {
        const btn = document.createElement("button");
        Object.assign(btn, {
            textContent: icon,
            title,
            ariaLabel: title,
        });
        Object.assign(btn.style, {
            width: "32px",
            height: "28px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            margin: "0 2px",
            color: "white",
            transition: "background 0.15s ease",
            padding: "0",
        });
        btn.onmouseenter = () => (btn.style.background = hoverColor);
        btn.onmouseleave = () => (btn.style.background = "transparent");
        btn.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        return btn;
    };

    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; align-items: center;";

    const minimizeBtn = createButton("−", "Свернуть", () => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            container.style.height = "44px";
            content.style.display = "none";
            container.style.resize = "none";
        } else {
            container.style.height = originalState.height || "700px";
            content.style.display = "flex";
            container.style.resize = "both";
        }
    });

    const maximizeBtn = createButton("□", "На весь экран", () => {
        if (!isMaximized) {
            originalState = {
                top: container.style.top,
                left: container.style.left,
                width: container.style.width,
                height: container.style.height,
                transform: container.style.transform,
            };
            Object.assign(container.style, {
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                transform: "none",
                borderRadius: "0",
            });
            header.style.borderRadius = "0";
            maximizeBtn.textContent = "⤡";
            maximizeBtn.title = "Восстановить";
            isMaximized = true;
        } else {
            Object.assign(container.style, {
                ...originalState,
                borderRadius: "8px",
            });
            header.style.borderRadius = "8px 8px 0 0";
            maximizeBtn.textContent = "□";
            maximizeBtn.title = "На весь экран";
            isMaximized = false;
        }
    });

    const closeBtn = createButton(
        "✕",
        "Закрыть",
        () => container.remove(),
        "#e74c3c",
    );

    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    controls.appendChild(closeBtn);

    const titleEl = document.createElement("span");
    Object.assign(titleEl, {
        textContent: title,
        style:
            "font-weight: 600; font-size: 13px; color: white; flex: 1;",
    });

    header.appendChild(titleEl);
    header.appendChild(controls);

    const content = document.createElement("div");
    Object.assign(content.style, {
        flex: "1",
        position: "relative",
        display: "flex",
        flexDirection: "column",
    });

    const loadingEl = document.createElement("div");
    Object.assign(loadingEl, {
        textContent: "⏳ Загрузка...",
        style:
            "position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #666; background: #f5f5f5; z-index: 1;",
    });

    const iframe = document.createElement("iframe");
    Object.assign(iframe, {src: url});
    Object.assign(iframe.style, {
        width: "100%",
        height: "100%",
        border: "none",
        opacity: "0",
        transition: "opacity 0.3s",
    });

    iframe.onload = () => {
        loadingEl.remove();
        iframe.style.opacity = "1";
    };

    content.appendChild(loadingEl);
    content.appendChild(iframe);

    const handleDrag = (e: MouseEvent) => {
        if (!isDragging || isMaximized) return;
        container.style.left = e.clientX - dragOffset.x + "px";
        container.style.top = e.clientY - dragOffset.y + "px";
        container.style.transform = "none";
    };

    header.addEventListener("mousedown", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "BUTTON") return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        dragOffset = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        e.preventDefault();
    });

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", () => (isDragging = false));

    header.addEventListener("dblclick", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "BUTTON") return;
        maximizeBtn.click();
    });

    container.addEventListener("mousedown", (e) => e.stopPropagation());
    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);
}

/**
 * Extracts action parameters from onclick attribute
 */
export function extractActionParams(onclick: string): {
    session: string;
    user: string;
    requestId: string;
} | null {
    const match = onclick.match(
        /changeAppealInNewTab\('([^']+)',\s*(\d+),\s*(\d+)\)/,
    );
    return match
        ? {session: match[1], user: match[2], requestId: match[3]}
        : null;
}

/**
 * Builds action URL with global parameters
 */
export function buildActionUrl(params: {
    session: string;
    user: string;
    requestId: string;
}): string {
    let url = `${window.location.origin}/cgi-bin/ppo/excells/wcc_request_appl_support.change_request_appl?ssn$c=${params.session}&usr$i=${params.user}&request_id$i=${params.requestId}`;
    const globalParams = (window as {
        globalParams?: Record<string, string>;
    }).globalParams;
    if (globalParams) {
        if (globalParams.rck) url += `&rck$c=${globalParams.rck}`;
        if (globalParams.rcd) url += `&rcd$c=${globalParams.rcd}`;
        if (globalParams.interaction_id)
            url += `&interaction_id$i=${globalParams.interaction_id}`;
    }
    return url;
}