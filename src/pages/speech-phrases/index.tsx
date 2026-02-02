import {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {useSpeechPhrases} from '@src/pages/options/hooks/useSpeechPhrases';
import SpeechPhrasesSection from '@src/pages/options/components/SpeechPhrasesSection';
import '@src/pages/options/index.css'; // Import CSS variables first
import '@src/pages/options/Options.css'; // Then component styles
import './SpeechPhrasesManager.css'; // Page-specific styles last

function SpeechPhrasesManager() {
    const speechPhrases = useSpeechPhrases();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (speechPhrases.phrases.length >= 0 && speechPhrases.categories.length >= 0) {
            setIsReady(true);
        }
    }, [speechPhrases.phrases, speechPhrases.categories]);

    if (!isReady) {
        return (
            <div className="speech-phrases-page-loading">
                <div className="speech-phrases-spinner"/>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="speech-phrases-page">
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
    );
}

const root = ReactDOM.createRoot(document.getElementById('__root')!);
root.render(<SpeechPhrasesManager/>);
