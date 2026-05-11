export interface LinkCategory {
    title: string;
    links: LinkItem[];
    noMargin?: boolean;
}

export interface LinkItem {
    href: string;
    label: string;
    external?: boolean;
}

export interface MacLookupResult {
    company: string;
    error?: string;
}

export interface ToolInputProps {
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    buttonLabel: string;
    onAction?: () => void;
}

export type Tab = 'Главная' | 'Инструменты' | 'Что нового';
