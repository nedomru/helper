import type {Settings} from '../types';
import type {FeatureGroup} from '../constants/feature-groups';
import React from "react";

interface FeatureCardProps {
    category: keyof Settings;
    group: FeatureGroup;
    settings: Settings;
    searchQuery: string;
    updateSetting: (category: keyof Settings, key: string, value: boolean) => void;
    renderCustomContent?: (group: FeatureGroup) => React.ReactNode;
}

export default function FeatureCard({
                                        category,
                                        group,
                                        settings,
                                        searchQuery,
                                        updateSetting,
                                        renderCustomContent,
                                    }: FeatureCardProps) {
    if (group.isCustom && renderCustomContent) {
        return <>{renderCustomContent(group)}</>;
    }

    return (
        <div key={group.title} className="card">
            <div className="card-header">
                <div className="card-header-content">
                    <span className="card-icon">{group.icon}</span>
                    <div className="card-header-text">
                        <h3 className="card-title">{group.title}</h3>
                        <p className="card-description">{group.description}</p>
                    </div>
                </div>
            </div>
            <div className="feature-list">
                {group.features
                    .filter(
                        (f) =>
                            f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((feature) => {
                        const isChecked = settings[category]?.[feature.key] === true;
                        return (
                            <div key={feature.key} className="feature-item">
                                <div className="feature-info">
                                    <label className="feature-label" htmlFor={`feature-${feature.key}`}>
                                        {feature.label}
                                    </label>
                                    <span className="feature-description">{feature.description}</span>
                                </div>
                                <label className="switch">
                                    <input
                                        id={`feature-${feature.key}`}
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => updateSetting(category, feature.key, e.target.checked)}
                                    />
                                    <span className="slider"/>
                                </label>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
