export type SheetAddState = 'ready' | 'save-first' | 'blank' | 'hidden';

export function getSheetAddState(input: {
  ownPage: boolean;
  readOnly: boolean;
  currentSaved: boolean;
  dirty: boolean;
  hasContent: boolean;
}): SheetAddState {
  if (!input.ownPage || input.readOnly) return 'hidden';
  if (!input.hasContent) return 'blank';
  if (input.dirty || !input.currentSaved) return 'save-first';
  return 'ready';
}
