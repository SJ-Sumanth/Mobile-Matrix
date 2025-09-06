'use client';

import { useState, useEffect, useCallback } from 'react';
import { PhoneSelection } from '@/types/phone';

interface SelectionState {
  selections: PhoneSelection[];
  currentStep: 'brand_selection' | 'model_selection' | 'comparison';
  sessionId: string;
}

interface UseSelectionStateReturn {
  // State
  selections: PhoneSelection[];
  currentStep: 'brand_selection' | 'model_selection' | 'comparison';
  sessionId: string;
  
  // Actions
  addSelection: (selection: PhoneSelection) => void;
  removeSelection: (index: number) => void;
  updateSelection: (index: number, selection: PhoneSelection) => void;
  clearSelections: () => void;
  setCurrentStep: (step: 'brand_selection' | 'model_selection' | 'comparison') => void;
  persistState: () => void;
  loadState: () => void;
}

const STORAGE_KEY = 'mobile-matrix-selection-state';
const MAX_SELECTIONS = 4; // Allow up to 4 phones for comparison

export function useSelectionState(): UseSelectionStateReturn {
  const [state, setState] = useState<SelectionState>(() => ({
    selections: [],
    currentStep: 'brand_selection',
    sessionId: generateSessionId(),
  }));

  // Load state from localStorage on mount
  useEffect(() => {
    loadState();
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    persistState();
  }, [state]);

  // Add a new phone selection
  const addSelection = useCallback((selection: PhoneSelection) => {
    setState(prevState => {
      // Check if selection already exists
      const exists = prevState.selections.some(
        s => s.brand === selection.brand && 
            s.model === selection.model && 
            s.variant === selection.variant
      );
      
      if (exists) {
        return prevState;
      }
      
      // Limit the number of selections
      const newSelections = [...prevState.selections, selection];
      if (newSelections.length > MAX_SELECTIONS) {
        newSelections.shift(); // Remove the oldest selection
      }
      
      return {
        ...prevState,
        selections: newSelections,
        currentStep: newSelections.length >= 2 ? 'comparison' : 'model_selection',
      };
    });
  }, []);

  // Remove a phone selection by index
  const removeSelection = useCallback((index: number) => {
    setState(prevState => {
      const newSelections = prevState.selections.filter((_, i) => i !== index);
      
      return {
        ...prevState,
        selections: newSelections,
        currentStep: newSelections.length >= 2 ? 'comparison' : 
                    newSelections.length === 1 ? 'model_selection' : 'brand_selection',
      };
    });
  }, []);

  // Update a phone selection by index
  const updateSelection = useCallback((index: number, selection: PhoneSelection) => {
    setState(prevState => {
      const newSelections = [...prevState.selections];
      newSelections[index] = selection;
      
      return {
        ...prevState,
        selections: newSelections,
      };
    });
  }, []);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      selections: [],
      currentStep: 'brand_selection',
    }));
  }, []);

  // Set current step
  const setCurrentStep = useCallback((step: 'brand_selection' | 'model_selection' | 'comparison') => {
    setState(prevState => ({
      ...prevState,
      currentStep: step,
    }));
  }, []);

  // Persist state to localStorage
  const persistState = useCallback(() => {
    try {
      const stateToSave = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to persist selection state:', error);
    }
  }, [state]);

  // Load state from localStorage
  const loadState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return;
      
      const parsedState = JSON.parse(savedState);
      
      // Check if state is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (parsedState.timestamp && Date.now() - parsedState.timestamp > maxAge) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      
      setState(prevState => ({
        selections: parsedState.selections || [],
        currentStep: parsedState.currentStep || 'brand_selection',
        sessionId: parsedState.sessionId || prevState.sessionId,
      }));
    } catch (error) {
      console.warn('Failed to load selection state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    selections: state.selections,
    currentStep: state.currentStep,
    sessionId: state.sessionId,
    addSelection,
    removeSelection,
    updateSelection,
    clearSelections,
    setCurrentStep,
    persistState,
    loadState,
  };
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}