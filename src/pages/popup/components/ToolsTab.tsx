import type {ReactNode} from 'react';
import type {MacLookupResult} from '../types';
import {ToolInput} from './ToolInput';
import {MacResult} from './MacResult';

interface ToolsTabProps {
    macAddress: string;
    onMacChange: (value: string) => void;
    onMacLookup: () => void;
    macResult: MacLookupResult | null;
}

export function ToolsTab({macAddress, onMacChange, onMacLookup, macResult}: ToolsTabProps): ReactNode {
    return (
        <div className="space-y-3">
            <ToolInput
                label="Проверка MAC"
                value={macAddress}
                onChange={onMacChange}
                placeholder="Введи MAC"
                buttonLabel="Проверить"
                onAction={onMacLookup}
            />
            {macResult && <MacResult result={macResult}/>}
        </div>
    );
}
