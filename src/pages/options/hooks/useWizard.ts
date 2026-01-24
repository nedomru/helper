import {useCallback, useState} from 'react';
import type {SelectOption, WizardStep} from '../types';
import type {QuickAppealsPreset} from '@src/shared/user-settings';
import {hasChildReasons as checkChildReasons, loadAppealsSubcategories, loadChildReasons,} from '../utils/arm-api';

interface WizardState {
    open: boolean;
    step: WizardStep;
    editingId: string | null;
    selectedProduct: number | null;
    selectedProcessing: SelectOption | null;
    selectedCategory: SelectOption | null;
    selectedSubcategory: SelectOption | null;
    selectedChildReason: SelectOption | null;
    subcategories: SelectOption[];
    childReasons: SelectOption[];
    presetName: string;
    selectedPresetCategory: string | null;
    newCategoryName: string;
    presetComment: string;
    isLoadingSubcategories: boolean;
    isLoadingChildReasons: boolean;
}

interface UseWizardReturn extends WizardState {
    startWizard: () => void;
    editPreset: (preset: QuickAppealsPreset, loadCategoriesFn: (productId: number, processingId: string) => Promise<void>) => Promise<void>;
    closeWizard: () => void;
    selectProduct: (productId: number) => void;
    selectProcessing: (processing: SelectOption, loadCategoriesFn: (productId: number, processingId: string) => Promise<void>) => Promise<void>;
    selectCategory: (category: SelectOption) => Promise<void>;
    selectSubcategory: (subcategory: SelectOption) => Promise<void>;
    selectChildReason: (childReason: SelectOption) => void;
    setStep: (step: WizardStep) => void;
    setPresetName: (name: string) => void;
    setSelectedPresetCategory: (categoryId: string | null) => void;
    setNewCategoryName: (name: string) => void;
    setPresetComment: (comment: string) => void;
}

export function useWizard(): UseWizardReturn {
    const [wizardState, setWizardState] = useState<WizardState>({
        open: false,
        step: 'product',
        editingId: null,
        selectedProduct: null,
        selectedProcessing: null,
        selectedCategory: null,
        selectedSubcategory: null,
        selectedChildReason: null,
        subcategories: [],
        childReasons: [],
        presetName: '',
        selectedPresetCategory: null,
        newCategoryName: '',
        presetComment: '',
        isLoadingSubcategories: false,
        isLoadingChildReasons: false,
    });

    const startWizard = useCallback(() => {
        setWizardState({
            open: true,
            step: 'product',
            editingId: null,
            selectedProduct: null,
            selectedProcessing: null,
            selectedCategory: null,
            selectedSubcategory: null,
            selectedChildReason: null,
            subcategories: [],
            childReasons: [],
            presetName: '',
            selectedPresetCategory: null,
            newCategoryName: '',
            presetComment: '',
            isLoadingSubcategories: false,
            isLoadingChildReasons: false,
        });
    }, []);

    const editPreset = useCallback(
        async (
            preset: QuickAppealsPreset,
            loadCategoriesFn: (productId: number, processingId: string) => Promise<void>
        ) => {
            setWizardState((prev) => ({
                ...prev,
                open: true,
                step: 'name',
                editingId: preset.id,
                selectedProduct: preset.product,
                selectedProcessing: {value: preset.processing, label: preset.processingLabel},
                selectedCategory: {value: preset.category, label: preset.categoryLabel},
                selectedSubcategory: preset.subcategory
                    ? {value: preset.subcategory, label: preset.subcategoryLabel}
                    : null,
                selectedChildReason: preset.childReason
                    ? {value: preset.childReason, label: preset.childReasonLabel}
                    : null,
                presetName: preset.name,
                selectedPresetCategory: preset.categoryId || null,
                presetComment: preset.comment || '',
            }));

            await loadCategoriesFn(preset.product, preset.processing);

            if (preset.subcategory) {
                // Load subcategories
                const subs = await loadAppealsSubcategories(preset.product, preset.processing, preset.category);
                setWizardState((prev) => ({...prev, subcategories: subs}));
            }

            if (preset.childReason) {
                // Load child reasons
                const children = await loadChildReasons(preset.product, preset.processing, preset.subcategory);
                setWizardState((prev) => ({...prev, childReasons: children}));
            }
        },
        []
    );

    const closeWizard = useCallback(() => {
        setWizardState((prev) => ({...prev, open: false, editingId: null}));
    }, []);

    const selectProduct = useCallback((productId: number) => {
        setWizardState((prev) => ({
            ...prev,
            selectedProduct: productId,
            step: 'processing',
        }));
    }, []);

    const selectProcessing = useCallback(
        async (
            processing: SelectOption,
            loadCategoriesFn: (productId: number, processingId: string) => Promise<void>
        ) => {
            setWizardState((prev) => ({
                ...prev,
                selectedProcessing: processing,
            }));

            if (wizardState.selectedProduct === null) return;

            await loadCategoriesFn(wizardState.selectedProduct, processing.value);
            setWizardState((prev) => ({...prev, step: 'category'}));
        },
        [wizardState.selectedProduct]
    );

    const selectCategory = useCallback(async (category: SelectOption) => {
        setWizardState((prev) => ({
            ...prev,
            selectedCategory: category,
            isLoadingSubcategories: true,
        }));

        if (wizardState.selectedProduct === null || !wizardState.selectedProcessing) {
            setWizardState((prev) => ({...prev, isLoadingSubcategories: false}));
            return;
        }

        const loadedSubcategories = await loadAppealsSubcategories(
            wizardState.selectedProduct,
            wizardState.selectedProcessing.value,
            category.value
        );

        setWizardState((prev) => ({
            ...prev,
            subcategories: loadedSubcategories,
            isLoadingSubcategories: false,
            step: loadedSubcategories.length === 0 ? 'comment' : 'subcategory',
        }));
    }, [wizardState.selectedProduct, wizardState.selectedProcessing]);

    const selectSubcategory = useCallback(async (subcategory: SelectOption) => {
        setWizardState((prev) => ({
            ...prev,
            selectedSubcategory: subcategory,
            isLoadingChildReasons: true,
        }));

        if (wizardState.selectedProduct === null || !wizardState.selectedProcessing) {
            setWizardState((prev) => ({...prev, isLoadingChildReasons: false}));
            return;
        }

        const hasChildren = await checkChildReasons(
            wizardState.selectedProduct,
            wizardState.selectedProcessing.value,
            subcategory.value
        );

        if (hasChildren) {
            const children = await loadChildReasons(
                wizardState.selectedProduct,
                wizardState.selectedProcessing.value,
                subcategory.value
            );
            setWizardState((prev) => ({
                ...prev,
                childReasons: children,
                isLoadingChildReasons: false,
                step: 'childreason',
            }));
        } else {
            setWizardState((prev) => ({
                ...prev,
                isLoadingChildReasons: false,
                step: 'comment',
            }));
        }
    }, [wizardState.selectedProduct, wizardState.selectedProcessing]);

    const selectChildReason = useCallback((childReason: SelectOption) => {
        setWizardState((prev) => ({
            ...prev,
            selectedChildReason: childReason,
            step: 'comment',
        }));
    }, []);

    return {
        ...wizardState,
        startWizard,
        editPreset,
        closeWizard,
        selectProduct,
        selectProcessing,
        selectCategory,
        selectSubcategory,
        selectChildReason,
        setStep: (step: WizardStep) => setWizardState((prev) => ({...prev, step})),
        setPresetName: (name: string) => setWizardState((prev) => ({...prev, presetName: name})),
        setSelectedPresetCategory: (categoryId: string | null) =>
            setWizardState((prev) => ({...prev, selectedPresetCategory: categoryId})),
        setNewCategoryName: (name: string) => setWizardState((prev) => ({...prev, newCategoryName: name})),
        setPresetComment: (comment: string) => setWizardState((prev) => ({...prev, presetComment: comment})),
    };
}
