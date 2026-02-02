import type {ReactNode} from 'react';
import type {LinkCategory} from '../types';

interface LinkSectionProps {
    category: LinkCategory;
    className?: string;
}

export function LinkSection({category, className}: LinkSectionProps): ReactNode {
    return (
        <div className={category.noMargin ? '' : className}>
            <h4 className={`font-bold text-gray-800 ${category.noMargin ? 'mb-3' : ''}`}>{category.title}</h4>
            <ul>
                {category.links.map((link) => (
                    <li key={link.href}>
                        <a href={link.href} className="text-blue-600 hover:underline text-sm" target="_blank"
                           rel="noopener noreferrer">
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
