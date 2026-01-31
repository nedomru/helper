import {useEffect, useState} from 'react';
import Auth from '@src/components/Auth';
import type {QuickAppealsPreset} from '@src/shared/user-settings';
import {updateUserSettings} from '@src/shared/user-settings';
import {notify} from '@src/utils/notify';
import type {SelectOption, Settings, UpdateStatus} from './types';
import {armFeatureGroups, genesysFeatureGroups} from './constants/feature-groups';
import {importSettings} from './utils/export-import';
import {useAuth} from './hooks/useAuth';
import {useQuickAppeals} from './hooks/useQuickAppeals';
import {useWizard} from './hooks/useWizard';
import {useSpeechPhrases} from './hooks/useSpeechPhrases';
import Header from './components/Header';
import TabsNav from './components/TabsNav';
import SearchBar from './components/SearchBar';
import ActionsToolbar from './components/ActionsToolbar';
import FeatureCard from './components/FeatureCard';
import QuickAppealsSection from './components/QuickAppealsSection';
import HiddenTabsSection from './components/HiddenTabsSection';
import AnticipationFoldingSection from './components/AnticipationFoldingSection';
import SpeechPhrasesSection from './components/SpeechPhrasesSection';
import PresetWizard from './components/PresetWizard';
import {checkForUpdates} from './utils/updates';
import './Options.css';

export default function Options() {
    const [activeSection, setActiveSection] = useState<'arm' | 'genesys' | 'line' | 'speech'>('arm');
    const [searchQuery, setSearchQuery] = useState('');
    const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);
    const [foldingTabs, setFoldingTabs] = useState<string[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isMac, setIsMac] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
        checking: false,
        hasUpdate: null,
        latestVersion: null,
    });

    // Wizard search queries
    const [processingSearchQuery, setProcessingSearchQuery] = useState('');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
    const [childReasonSearchQuery, setChildReasonSearchQuery] = useState('');

    const {
        isAuthenticatedState,
        currentUser,
        settings,
        isLoading,
        handleAuthorized,
        handleLogout,
        setSettings,
    } = useAuth();

    const quickAppeals = useQuickAppeals();
    const wizard = useWizard();
    const speechPhrases = useSpeechPhrases();

    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

        const manifest = chrome.runtime.getManifest();
        if (manifest?.version) {
            setVersion(manifest.version);
        }

        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme) {
                setTheme(result.theme as 'light' | 'dark');
                document.documentElement.setAttribute('data-theme', result.theme);
            }
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input') as HTMLInputElement;
                searchInput?.focus();
            }
            if (e.key === 'Escape' && searchQuery) {
                setSearchQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery]);

    useEffect(() => {
        if (version) {
            checkForUpdates(version, true).then(setUpdateStatus);
        }
    }, [version]);

    useEffect(() => {
        if (settings?.arm?.hiddenTabs) {
            const tabs = settings.arm.hiddenTabs as string[];
            if (Array.isArray(tabs)) {
                setHiddenTabs(tabs);
            }
        }
        if (settings?.arm?.foldingTabs) {
            const tabs = settings.arm.foldingTabs as string[];
            if (Array.isArray(tabs)) {
                setFoldingTabs(tabs);
            }
        }
    }, [settings]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({theme: newTheme});
    };

    const updateSetting = async (category: keyof Settings, key: string, value: boolean) => {
        const newSettings = {
            ...settings,
            [category]: {
                ...(settings[category] ?? {}),
                [key]: value,
            },
        };
        setSettings(newSettings);
        try {
            const success = await updateUserSettings(newSettings);
            if (!success) {
                notify('Настройки', 'Ошибка при сохранении настроек', 'error');
            }
        } catch {
            notify('Настройки', 'Ошибка при сохранении настроек', 'error');
        }
    };

    const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const importedSettings = await importSettings(event);
        if (importedSettings) {
            setSettings(importedSettings);
            const success = await updateUserSettings(importedSettings);
            if (!success) {
                notify('Настройки', 'Ошибка при сохранении настроек', 'error');
            }
        }
    };

    // Wizard handlers
    const handleStartWizard = () => {
        wizard.startWizard();
    };

    const handleSelectProcessing = async (processing: SelectOption) => {
        await wizard.selectProcessing(processing, quickAppeals.loadCategoriesFromArm);
    };

    const handleEditPreset = async (presetId: string) => {
        const preset = quickAppeals.quickAppealsPresets.find((p) => p.id === presetId);
        if (!preset) return;

        await wizard.editPreset(preset, quickAppeals.loadCategoriesFromArm);
    };

    const handleSavePreset = async () => {
        if (
            wizard.selectedProduct === null ||
            !wizard.selectedProcessing ||
            !wizard.selectedCategory ||
            !wizard.presetName.trim()
        ) {
            notify('Быстрые обращения', 'Заполните все поля', 'error');
            return;
        }

        const preset: QuickAppealsPreset = {
            id: wizard.editingId || Date.now().toString(),
            name: wizard.presetName.trim(),
            product: wizard.selectedProduct,
            processing: wizard.selectedProcessing.value,
            processingLabel: wizard.selectedProcessing.label,
            category: wizard.selectedCategory.value,
            categoryLabel: wizard.selectedCategory.label,
            subcategory: wizard.selectedSubcategory?.value,
            subcategoryLabel: wizard.selectedSubcategory?.label,
            childReason: wizard.selectedChildReason?.value,
            childReasonLabel: wizard.selectedChildReason?.label,
            categoryId: wizard.selectedPresetCategory || null,
            comment: wizard.presetComment.trim() || undefined,
        };

        const success = await quickAppeals.savePreset(preset, !!wizard.editingId);
        if (success) {
            wizard.closeWizard();
        }
    };

    const handleWizardCreateCategory = async () => {
        const newCategory = await quickAppeals.createNewCategory(wizard.newCategoryName);
        if (newCategory) {
            wizard.setSelectedPresetCategory(newCategory.id);
            wizard.setNewCategoryName('');
        }
    };

    if (isAuthenticatedState === null) {
        return (
            <div className="options-page">
                <div className="loading-state">
                    <div className="spinner"/>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticatedState) {
        return <Auth onAuthorized={handleAuthorized}/>;
    }

    const renderQuickAppealsCustom = () => {
        return (
            <QuickAppealsSection
                quickAppealsPresets={quickAppeals.quickAppealsPresets}
                presetCategories={quickAppeals.presetCategories}
                onStartWizard={handleStartWizard}
                onEditPreset={handleEditPreset}
                onDuplicatePreset={quickAppeals.duplicatePreset}
                onRemovePreset={quickAppeals.removePreset}
                onDuplicateCategory={quickAppeals.duplicateCategory}
                onDeleteCategory={quickAppeals.deleteCategory}
                onSaveEditCategory={quickAppeals.saveEditCategory}
                onMergeImportedData={quickAppeals.mergeImportedData}
                onMoveCategoryUp={quickAppeals.moveCategoryUp}
                onMoveCategoryDown={quickAppeals.moveCategoryDown}
            />
        );
    };

    const renderHiddenTabsCustom = () => {
        return (
            <HiddenTabsSection
                hiddenTabs={hiddenTabs}
                onHiddenTabsChange={setHiddenTabs}
            />
        );
    };

    const renderAnticipationFoldingCustom = () => {
        return (
            <AnticipationFoldingSection
                foldSpas={settings?.arm?.foldSpas ?? false}
                onFoldSpasChange={(value) => updateSetting('arm', 'foldSpas', value)}
                foldingTabs={foldingTabs}
                onFoldingTabsChange={(tabs) => {
                    setFoldingTabs(tabs);
                    setSettings({
                        ...settings,
                        arm: {
                            ...(settings?.arm ?? {}),
                            foldingTabs: tabs,
                        },
                    });
                }}
            />
        );
    };

    const renderCustomContent = (group: { title: string }) => {
        if (group.title === 'Быстрые обращения') {
            return renderQuickAppealsCustom();
        }
        if (group.title === 'Скрытие вкладок') {
            return renderHiddenTabsCustom();
        }
        if (group.title === 'Сворачивание') {
            return renderAnticipationFoldingCustom();
        }
        return null;
    };

    return (
        <div className="options-page">
            <Header
                currentUser={currentUser}
                version={version}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
            />

            <main className="options-main">
                <div className="main-content animate-fade-in">
                    <TabsNav activeSection={activeSection} onSectionChange={setActiveSection}/>
                    <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} isMac={isMac}/>
                    <ActionsToolbar
                        updateStatus={updateStatus}
                        version={version}
                        setUpdateStatus={setUpdateStatus}
                        onImportSettings={handleImportSettings}
                    />

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"/>
                            <p>Загрузка настроек...</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'arm' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки АРМ</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            АРМа</p>
                                    </div>
                                    {armFeatureGroups.map((group) => (
                                        <FeatureCard
                                            key={group.title}
                                            category="arm"
                                            group={group}
                                            settings={settings}
                                            searchQuery={searchQuery}
                                            updateSetting={updateSetting}
                                            renderCustomContent={renderCustomContent}
                                        />
                                    ))}
                                </div>
                            )}

                            {activeSection === 'genesys' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки Генезиса</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            Генезиса</p>
                                    </div>
                                    {genesysFeatureGroups.map((group) => (
                                        <FeatureCard
                                            key={group.title}
                                            category="genesys"
                                            group={group}
                                            settings={settings}
                                            searchQuery={searchQuery}
                                            updateSetting={updateSetting}
                                        />
                                    ))}
                                </div>
                            )}

                            {activeSection === 'line' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Настройки Линии</h2>
                                        <p className="section-description">Управление функциями, связанными с работой
                                            Линии</p>
                                    </div>
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="card-header-content">
                                                <span className="card-icon">💚</span>
                                                <div className="card-header-text">
                                                    <h3 className="card-title">Линия</h3>
                                                    <p className="card-description"></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="feature-list">
                                            <div className="feature-item">
                                                <div className="feature-info">
                                                    <label className="feature-label" htmlFor="line-features">
                                                        Включить функции Line
                                                    </label>
                                                    <span className="feature-description">Активировать все функции интеграции с Line</span>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        id="line-features"
                                                        type="checkbox"
                                                        checked={settings.line?.featuresEnabled === true}
                                                        onChange={(e) => updateSetting('line', 'featuresEnabled', e.target.checked)}
                                                    />
                                                    <span className="slider"/>
                                                </label>
                                            </div>
                                            <div className="feature-item">
                                                <div className="feature-info">
                                                    <label className="feature-label" htmlFor="line-notifications">
                                                        Уведомления
                                                    </label>
                                                    <span
                                                        className="feature-description">Показывать уведомления от Line</span>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        id="line-notifications"
                                                        type="checkbox"
                                                        checked={settings.line?.notificationsEnabled === true}
                                                        onChange={(e) => updateSetting('line', 'notificationsEnabled', e.target.checked)}
                                                    />
                                                    <span className="slider"/>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'speech' && (
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">РМы</h2>
                                        <p className="section-description">
                                            Управление текстовыми сокращениями для быстрой вставки
                                        </p>
                                    </div>
                                    <SpeechPhrasesSection
                                        phrases={speechPhrases.phrases}
                                        categories={speechPhrases.categories}
                                        isCreatingPhrase={speechPhrases.isCreatingPhrase}
                                        isCreatingCategory={speechPhrases.isCreatingCategory}
                                        editingPhraseId={speechPhrases.editingPhraseId}
                                        editingCategoryId={speechPhrases.editingCategoryId}
                                        newPhraseShortcut={speechPhrases.newPhraseShortcut}
                                        newPhraseName={speechPhrases.newPhraseName}
                                        newPhraseText={speechPhrases.newPhraseText}
                                        newPhraseCategoryId={speechPhrases.newPhraseCategoryId}
                                        newCategoryName={speechPhrases.newCategoryName}
                                        editPhraseShortcut={speechPhrases.editPhraseShortcut}
                                        editPhraseName={speechPhrases.editPhraseName}
                                        editPhraseText={speechPhrases.editPhraseText}
                                        editPhraseCategoryId={speechPhrases.editPhraseCategoryId}
                                        editCategoryName={speechPhrases.editCategoryName}
                                        setNewPhraseShortcut={speechPhrases.setNewPhraseShortcut}
                                        setNewPhraseName={speechPhrases.setNewPhraseName}
                                        setNewPhraseText={speechPhrases.setNewPhraseText}
                                        setNewPhraseCategoryId={speechPhrases.setNewPhraseCategoryId}
                                        setNewCategoryName={speechPhrases.setNewCategoryName}
                                        setEditPhraseShortcut={speechPhrases.setEditPhraseShortcut}
                                        setEditPhraseName={speechPhrases.setEditPhraseName}
                                        setEditPhraseText={speechPhrases.setEditPhraseText}
                                        setEditPhraseCategoryId={speechPhrases.setEditPhraseCategoryId}
                                        setEditCategoryName={speechPhrases.setEditCategoryName}
                                        startCreatePhrase={speechPhrases.startCreatePhrase}
                                        cancelCreatePhrase={speechPhrases.cancelCreatePhrase}
                                        savePhrase={speechPhrases.savePhrase}
                                        startEditPhrase={speechPhrases.startEditPhrase}
                                        cancelEditPhrase={speechPhrases.cancelEditPhrase}
                                        updatePhrase={speechPhrases.updatePhrase}
                                        deletePhrase={speechPhrases.deletePhrase}
                                        duplicatePhrase={speechPhrases.duplicatePhrase}
                                        startCreateCategory={speechPhrases.startCreateCategory}
                                        cancelCreateCategory={speechPhrases.cancelCreateCategory}
                                        saveCategory={speechPhrases.saveCategory}
                                        startEditCategory={speechPhrases.startEditCategory}
                                        cancelEditCategory={speechPhrases.cancelEditCategory}
                                        updateCategory={speechPhrases.updateCategory}
                                        deleteCategory={speechPhrases.deleteCategory}
                                        duplicateCategory={speechPhrases.duplicateCategory}
                                        getCategoryTree={speechPhrases.getCategoryTree}
                                        moveCategory={speechPhrases.moveCategory}
                                        movePhrase={speechPhrases.movePhrase}
                                        getCategoryPath={speechPhrases.getCategoryPath}
                                        importPhrases={speechPhrases.importPhrases}
                                        clearAll={speechPhrases.clearAll}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <PresetWizard
                open={wizard.open}
                step={wizard.step}
                editingId={wizard.editingId}
                selectedProduct={wizard.selectedProduct}
                selectedProcessing={wizard.selectedProcessing}
                selectedCategory={wizard.selectedCategory}
                selectedSubcategory={wizard.selectedSubcategory}
                selectedChildReason={wizard.selectedChildReason}
                subcategories={wizard.subcategories}
                childReasons={wizard.childReasons}
                presetName={wizard.presetName}
                selectedPresetCategory={wizard.selectedPresetCategory}
                newCategoryName={wizard.newCategoryName}
                presetComment={wizard.presetComment}
                appealsCategories={quickAppeals.appealsCategories}
                isLoadingCategories={quickAppeals.isLoadingCategories}
                isLoadingSubcategories={wizard.isLoadingSubcategories}
                isLoadingChildReasons={wizard.isLoadingChildReasons}
                processingSearchQuery={processingSearchQuery}
                categorySearchQuery={categorySearchQuery}
                subcategorySearchQuery={subcategorySearchQuery}
                childReasonSearchQuery={childReasonSearchQuery}
                presetCategories={quickAppeals.presetCategories}
                onSelectProduct={wizard.selectProduct}
                onSelectProcessing={handleSelectProcessing}
                onSelectCategory={wizard.selectCategory}
                onSelectSubcategory={wizard.selectSubcategory}
                onSelectChildReason={wizard.selectChildReason}
                setStep={wizard.setStep}
                setPresetName={wizard.setPresetName}
                setSelectedPresetCategory={wizard.setSelectedPresetCategory}
                setNewCategoryName={wizard.setNewCategoryName}
                setPresetComment={wizard.setPresetComment}
                setProcessingSearchQuery={setProcessingSearchQuery}
                setCategorySearchQuery={setCategorySearchQuery}
                setSubcategorySearchQuery={setSubcategorySearchQuery}
                setChildReasonSearchQuery={setChildReasonSearchQuery}
                onClose={wizard.closeWizard}
                onSave={handleSavePreset}
                onCreateCategory={handleWizardCreateCategory}
            />
        </div>
    );
}
