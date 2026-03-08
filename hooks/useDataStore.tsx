'use client';

// ============================================================
// Global Data Store — React Context for app-wide state
// Uses Carbon Design System palettes (theme-aware)
// ============================================================

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { DataSet, DashboardConfig, FilterOption, CleaningResult } from '@/lib/types';
import { parseFile } from '@/lib/parser';
import { autoClean, applyCleaningAction } from '@/lib/cleaner';
import { analyzeDashboard, applyFilters } from '@/lib/analyzer';

// ── State shape ──────────────────────────────────────────────

interface AppState {
    // Data pipeline
    rawDataset: DataSet | null;
    cleanedDataset: DataSet | null;
    dashboardConfig: DashboardConfig | null;
    filteredRows: Record<string, unknown>[] | null;

    // UI state
    currentStep: 'upload' | 'preview' | 'dashboard';
    isLoading: boolean;
    error: string | null;

    // Cleaning history (undo stack)
    cleaningHistory: DataSet[];
    lastCleaningResult: CleaningResult | null;
}

const initialState: AppState = {
    rawDataset: null,
    cleanedDataset: null,
    dashboardConfig: null,
    filteredRows: null,
    currentStep: 'upload',
    isLoading: false,
    error: null,
    cleaningHistory: [],
    lastCleaningResult: null,
};

// ── Actions ──────────────────────────────────────────────────

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_RAW_DATASET'; payload: DataSet }
    | { type: 'SET_CLEANED_DATASET'; payload: { dataset: DataSet; result?: CleaningResult } }
    | { type: 'SET_DASHBOARD_CONFIG'; payload: DashboardConfig }
    | { type: 'SET_FILTERED_ROWS'; payload: Record<string, unknown>[] }
    | { type: 'SET_STEP'; payload: 'upload' | 'preview' | 'dashboard' }
    | { type: 'UNDO_CLEANING' }
    | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload, error: null };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_RAW_DATASET':
            return { ...state, rawDataset: action.payload };
        case 'SET_CLEANED_DATASET':
            return {
                ...state,
                cleanedDataset: action.payload.dataset,
                lastCleaningResult: action.payload.result || null,
                cleaningHistory: state.cleanedDataset
                    ? [...state.cleaningHistory, state.cleanedDataset]
                    : state.cleaningHistory,
            };
        case 'SET_DASHBOARD_CONFIG':
            return { ...state, dashboardConfig: action.payload };
        case 'SET_FILTERED_ROWS':
            return { ...state, filteredRows: action.payload };
        case 'SET_STEP':
            return { ...state, currentStep: action.payload };
        case 'UNDO_CLEANING': {
            if (state.cleaningHistory.length === 0) return state;
            const previous = state.cleaningHistory[state.cleaningHistory.length - 1];
            return {
                ...state,
                cleanedDataset: previous,
                cleaningHistory: state.cleaningHistory.slice(0, -1),
                lastCleaningResult: null,
            };
        }
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

// ── Context ──────────────────────────────────────────────────

interface AppContextValue {
    state: AppState;
    uploadFile: (file: File) => Promise<void>;
    applyCleaning: (actionId: string) => void;
    undoCleaning: () => void;
    generateDashboard: (isDark?: boolean) => void;
    updateFilters: (filters: FilterOption[], isDark?: boolean) => void;
    goToStep: (step: 'upload' | 'preview' | 'dashboard') => void;
    resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function DataStoreProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const uploadFile = useCallback(async (file: File) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const rawDataset = await parseFile(file);
            dispatch({ type: 'SET_RAW_DATASET', payload: rawDataset });

            // Auto-clean
            const cleanResult = autoClean(rawDataset);
            dispatch({
                type: 'SET_CLEANED_DATASET',
                payload: { dataset: cleanResult.dataset, result: cleanResult },
            });

            dispatch({ type: 'SET_STEP', payload: 'preview' });
            dispatch({ type: 'SET_LOADING', payload: false });
        } catch (err) {
            dispatch({
                type: 'SET_ERROR',
                payload: err instanceof Error ? err.message : 'Failed to parse file.',
            });
        }
    }, []);

    const applyCleaning = useCallback(
        (actionId: string) => {
            if (!state.cleanedDataset) return;
            const result = applyCleaningAction(state.cleanedDataset, actionId);
            dispatch({
                type: 'SET_CLEANED_DATASET',
                payload: { dataset: result.dataset, result },
            });
        },
        [state.cleanedDataset]
    );

    const undoCleaning = useCallback(() => {
        dispatch({ type: 'UNDO_CLEANING' });
    }, []);

    const generateDashboard = useCallback(
        (isDark: boolean = true) => {
            if (!state.cleanedDataset) return;
            const config = analyzeDashboard(state.cleanedDataset, isDark);
            dispatch({ type: 'SET_DASHBOARD_CONFIG', payload: config });
            dispatch({ type: 'SET_FILTERED_ROWS', payload: state.cleanedDataset.rows });
            dispatch({ type: 'SET_STEP', payload: 'dashboard' });
        },
        [state.cleanedDataset]
    );

    const updateFilters = useCallback(
        (filters: FilterOption[], isDark: boolean = true) => {
            if (!state.cleanedDataset || !state.dashboardConfig) return;
            const filtered = applyFilters(state.cleanedDataset, filters);
            dispatch({ type: 'SET_FILTERED_ROWS', payload: filtered });

            // Re-analyze with filtered data
            const filteredDataset: DataSet = {
                ...state.cleanedDataset,
                rows: filtered,
                rowCount: filtered.length,
            };
            const newConfig = analyzeDashboard(filteredDataset, isDark);
            dispatch({
                type: 'SET_DASHBOARD_CONFIG',
                payload: { ...newConfig, filters },
            });
        },
        [state.cleanedDataset, state.dashboardConfig]
    );

    const goToStep = useCallback((step: 'upload' | 'preview' | 'dashboard') => {
        dispatch({ type: 'SET_STEP', payload: step });
    }, []);

    const resetAll = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    return (
        <AppContext.Provider
            value={{
                state,
                uploadFile,
                applyCleaning,
                undoCleaning,
                generateDashboard,
                updateFilters,
                goToStep,
                resetAll,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────

export function useDataStore(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useDataStore must be used within DataStoreProvider');
    return ctx;
}
