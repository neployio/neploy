"use client";

import { useEffect, useState } from "react";
import { Button } from "frontend/src/components/ui/button";
import { Checkbox } from "frontend/src/components/ui/checkbox";
import { Label } from "frontend/src/components/ui/label";
import { ScrollArea } from "frontend/src/components/ui/scroll-area";
import { DialogFooter } from "frontend/src/components/ui/dialog";
import { TechStack } from "frontend/src/types";

interface TechAssignmentDialogProps {
  userId: string;
  allTechStacks: TechStack[];
  selectedTechIds: string[];
  onSave: (userId: string, techIds: string[]) => void;
}

export function TechAssignmentDialog({ userId, allTechStacks, selectedTechIds, onSave }: TechAssignmentDialogProps) {
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [initialSelection, setInitialSelection] = useState<string[]>([]);

  // Initialize selected techs when dialog opens
  useEffect(() => {
    setSelectedTechs([...selectedTechIds]);
    setInitialSelection([...selectedTechIds]);
  }, [selectedTechIds]);

  // Check if there are any changes compared to initial selection
  const hasChanges = () => {
    if (selectedTechs.length !== initialSelection.length) return true;
    return !selectedTechs.every((tech) => initialSelection.includes(tech));
  };

  const handleToggleTech = (techId: string) => {
    setSelectedTechs((prev) => (prev.includes(techId) ? prev.filter((id) => id !== techId) : [...prev, techId]));
  };

  const handleSave = () => {
    onSave(userId, selectedTechs);
  };

  return (
    <>
      <ScrollArea className="max-h-[60vh] mt-4 pr-4">
        <div className="gap-4 grid grid-cols-3 pb-4">
          {allTechStacks.map((tech) => (
            <div key={tech.id} className="flex items-center space-x-2">
              <Checkbox id={`tech-${tech.id}`} checked={selectedTechs.includes(tech.id)} onCheckedChange={() => handleToggleTech(tech.id)} />
              <Label htmlFor={`tech-${tech.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {tech.name}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      <DialogFooter className="flex items-center justify-between sm:justify-between">
        <Button type="button" onClick={handleSave} disabled={!hasChanges()}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}
