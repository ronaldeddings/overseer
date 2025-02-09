import React, { useState, useCallback } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NodeOutput } from '@/lib/types/workflow';
import { ContextPanel } from './ContextPanel';

interface InputBuilderProps {
  value: string;
  onChange: (value: string) => void;
  availableContext: Record<string, NodeOutput>;
  placeholder?: string;
}

export function InputBuilder({
  value,
  onChange,
  availableContext,
  placeholder
}: InputBuilderProps) {
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleContextSelect = useCallback((path: string) => {
    if (cursorPosition === null) return;

    const template = `\${${path}}`;
    const newValue = 
      value.slice(0, cursorPosition) + 
      template + 
      value.slice(cursorPosition);
    
    onChange(newValue);
  }, [value, onChange, cursorPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  // Extract context variables from the input value
  const contextVariables = value.match(/\$\{([^}]+)\}/g)?.map(match => {
    return match.slice(2, -1); // Remove ${ and }
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Input
          value={value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyUp={handleInputKeyUp}
          placeholder={placeholder}
          className="font-mono"
        />
        
        {contextVariables.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {contextVariables.map((variable, index) => (
              <Badge key={index} variant="secondary">
                {variable}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ContextPanel
        outputs={availableContext}
        onSelect={handleContextSelect}
      />
    </div>
  );
} 