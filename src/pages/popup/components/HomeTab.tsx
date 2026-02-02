import type {ReactNode} from 'react';
import {COLUMNS_COUNT, LINKS_DATA} from '../data/links';
import {LinkSection} from './LinkSection';

export function HomeTab(): ReactNode {
    const itemsPerColumn = Math.ceil(LINKS_DATA.length / COLUMNS_COUNT);

    return (
        <div className="grid grid-cols-3">
            {Array.from({length: COLUMNS_COUNT}).map((_, columnIndex) => {
                const start = columnIndex * itemsPerColumn;
                const end = start + itemsPerColumn;
                const columnCategories = LINKS_DATA.slice(start, end);

                return (
                    <div key={columnIndex}>
                        {columnCategories.map((category, index) => (
                            <LinkSection key={category.title} category={category} className={index > 0 ? 'mt-4' : ''}/>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
