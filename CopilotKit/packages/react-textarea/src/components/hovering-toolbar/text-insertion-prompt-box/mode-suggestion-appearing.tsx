import useAutosizeTextArea from "../../../hooks/misc/use-autosize-textarea";
import { MinimalChatGPTMessage } from "../../../types";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import React, { useEffect, useRef, useState } from "react";

export type State_SuggestionAppearing = {
  type: "suggestion-appearing";
  initialSuggestion: SuggestionSnapshot;
};

type SuggestionSnapshot = {
  adjustmentPrompt: string;
  generatingSuggestion: ReadableStream<string>;
};

export interface SuggestionAppearingProps {
  state: State_SuggestionAppearing;
  performInsertion: (insertedText: string) => void;
  goBack: () => void;

  // adjustmentGenerator: (
  //   editorState: InsertionEditorState,
  //   history: SuggestionSnapshot[]
  // ) => Promise<string>;
}

export const SuggestionAppearing: React.FC<SuggestionAppearingProps> = ({
  performInsertion,
  state,
  goBack,
}) => {
  const [adjustmentHistory, setAdjustmentHistory] = useState<
    SuggestionSnapshot[]
  >([state.initialSuggestion]);

  const [editSuggestion, setEditSuggestion] = useState<string>("");
  const [adjustmentPrompt, setAdjustmentPrompt] = useState<string>("");
  const [adjustmentLoading, setAdjustmentLoading] = useState<boolean>(false);

  useEffect(() => {
    const reader = state.initialSuggestion.generatingSuggestion.getReader();

    const read = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        setEditSuggestion((prev) => prev + value);
      }
    };

    read();
    
    return () => {
      reader.releaseLock();
    };
  }, []);

  const suggestionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const adjustmentTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutosizeTextArea(suggestionTextAreaRef, editSuggestion || "");
  useAutosizeTextArea(adjustmentTextAreaRef, adjustmentPrompt || "");

  // initially focus on the end of the suggestion text area
  useEffect(() => {
    suggestionTextAreaRef.current?.focus();
    suggestionTextAreaRef.current?.setSelectionRange(
      editSuggestion.length,
      editSuggestion.length
    );
  }, []);

  const generateAdjustment = async () => {
    // don't generate text if the prompt is empty
    if (!adjustmentPrompt.trim()) {
      return;
    }

    // modify the history
  };

  return (
    <div className="w-full flex flex-col items-start relative gap-2">
      <Label className="">Describe adjustments to the suggested text:</Label>
      <textarea
        ref={adjustmentTextAreaRef}
        value={adjustmentPrompt}
        onChange={(e) => setAdjustmentPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            setAdjustmentPrompt(adjustmentPrompt + "\n");
          } else if (e.key === "Enter") {
            e.preventDefault();
            generateAdjustment();
          }
        }}
        placeholder={'"make it more formal", "be more specific", ...'}
        className="w-full bg-slate-100 h-auto text-sm p-2 rounded-md resize-none overflow-visible focus:outline-none focus:ring-0 focus:border-none"
        rows={1}
      />

      <Label className=" mt-4">Suggested:</Label>
      <textarea
        ref={suggestionTextAreaRef}
        value={editSuggestion}
        disabled={adjustmentLoading}
        onChange={(e) => setEditSuggestion(e.target.value)}
        className="w-full text-base p-2 border border-gray-300 rounded-md resize-none bg-green-200"
        style={{ overflow: "auto", maxHeight: "8em" }}
      />

      <div className="flex w-full gap-4 justify-start">
        <Button
          className=" bg-gray-300"
          onClick={() => {
            goBack();
          }}
        >
          <i className="material-icons">arrow_back</i> Back
        </Button>

        <Button
          className=" bg-green-700 text-white"
          onClick={() => {
            performInsertion(editSuggestion);
          }}
        >
          Insert <i className="material-icons">check</i>
        </Button>
      </div>
    </div>
  );
};