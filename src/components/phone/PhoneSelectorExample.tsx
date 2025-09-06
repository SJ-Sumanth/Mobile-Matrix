'use client';

import React, { useState } from 'react';
import { PhoneSelector } from './PhoneSelector';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PhoneSelection } from '@/types/phone';
import { useSelectionState } from '@/hooks/useSelectionState';

export function PhoneSelectorExample() {
  const {
    selections,
    addSelection,
    removeSelection,
    clearSelections,
    currentStep,
  } = useSelectionState();

  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectionComplete = (selection: PhoneSelection) => {
    addSelection(selection);
    setIsSelecting(false);
  };

  const handleStartSelection = () => {
    setIsSelecting(true);
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Phone Selection Demo
        </h1>
        <p className="text-muted-foreground">
          Demonstrate the phone selection and validation functionality
        </p>
      </div>

      {/* Current Selections */}
      {selections.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Selected Phones</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelections}
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {selections.map((selection, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {selection.brand} {selection.model}
                    </h3>
                    {selection.variant && (
                      <p className="text-sm text-muted-foreground">
                        {selection.variant}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelection(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {selections.length >= 2 && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                ✓ Ready for comparison! You have {selections.length} phones selected.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Selection Interface */}
      {isSelecting ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Select a Phone</h2>
            <Button
              variant="outline"
              onClick={handleCancelSelection}
            >
              Cancel
            </Button>
          </div>
          
          <PhoneSelector
            onSelectionComplete={handleSelectionComplete}
            onSelectionChange={(selection) => {
              console.log('Selection changed:', selection);
            }}
          />
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">
            {selections.length === 0 
              ? 'Start by selecting your first phone'
              : 'Add another phone to compare'
            }
          </h2>
          
          <Button
            onClick={handleStartSelection}
            size="lg"
            className="mb-4"
          >
            {selections.length === 0 ? 'Select First Phone' : 'Add Another Phone'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            You can select up to 4 phones for comparison
          </p>
        </Card>
      )}

      {/* Current Step Indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Step:</span>
          <span className="font-medium capitalize">
            {currentStep.replace('_', ' ')}
          </span>
        </div>
        
        <div className="mt-2 flex space-x-2">
          <div className={`h-2 flex-1 rounded ${
            currentStep === 'brand_selection' ? 'bg-primary' : 'bg-accent'
          }`} />
          <div className={`h-2 flex-1 rounded ${
            currentStep === 'model_selection' ? 'bg-primary' : 'bg-accent'
          }`} />
          <div className={`h-2 flex-1 rounded ${
            currentStep === 'comparison' ? 'bg-primary' : 'bg-accent'
          }`} />
        </div>
        
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Brand</span>
          <span>Model</span>
          <span>Compare</span>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">How it works:</h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Click "Select First Phone" to start the selection process</li>
          <li>2. Type a brand name (e.g., "Samsung", "Apple") and select from suggestions</li>
          <li>3. Type a model name (e.g., "Galaxy S24", "iPhone 15") and select from suggestions</li>
          <li>4. The system will validate your selection against the database</li>
          <li>5. If the phone isn't found, you'll see similar suggestions</li>
          <li>6. Add more phones to compare (up to 4 total)</li>
          <li>7. Your selections are automatically saved and persist across sessions</li>
        </ol>
      </Card>
    </div>
  );
}