import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suggestion } from "../types/types.Translation";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";

interface SuggestionPreviewDialogProps {
  open: boolean;
  suggestion: Suggestion | undefined;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onTextChange: (text: string) => void;
  copyToClipboard: (text: string) => Promise<void>;
  t: ReturnType<typeof useTranslations>;
}

export const SuggestionPreviewDialog: React.FC<SuggestionPreviewDialogProps> = ({
  open,
  suggestion,
  onOpenChange,
  onAccept,
  onTextChange,
  copyToClipboard,
  t,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-full sm:max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-center">
          {t("SuggestionsPanel.previewTitle", { default: "Suggestion Preview" })}
        </DialogTitle>
      </DialogHeader>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 md:gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Original
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(suggestion?.originalText || "")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
          <div className="rounded-md border bg-background p-3 h-72 md:h-96 overflow-auto whitespace-pre-wrap text-sm font-mono">
            {suggestion?.originalText || ""}
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suggestion
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(suggestion?.suggestedText || "")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
          <Textarea
            value={suggestion?.suggestedText || ""}
            onChange={(e) => onTextChange(e.target.value)}
            className="text-sm font-mono h-72 md:h-96 resize-none"
            placeholder="Edit suggestion..."
          />
        </div>
      </div>

      <DialogFooter className="mt-4 flex !justify-center gap-2">
        <Button onClick={onAccept} className="cursor-pointer">
          {t("SuggestionsPanel.accept")}
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          className="cursor-pointer"
        >
          {t("SuggestionsPanel.cancel", { default: "Cancel" })}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
