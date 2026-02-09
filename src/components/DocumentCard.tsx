import { FileText, Download, Trash2, Eye, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tables } from "@/integrations/supabase/types";

interface DocumentCardProps {
  doc: Tables<"documents">;
  onView: (doc: Tables<"documents">) => void;
  onDownload: (doc: Tables<"documents">) => void;
  onDelete: (doc: Tables<"documents">) => void;
}

const categoryColors: Record<string, string> = {
  Resume: "bg-blue-100 text-blue-700 border-blue-200",
  Photo: "bg-purple-100 text-purple-700 border-purple-200",
  ID: "bg-amber-100 text-amber-700 border-amber-200",
  Certificate: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Other: "bg-muted text-muted-foreground border-border",
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentCard({ doc, onView, onDownload, onDelete }: DocumentCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-xl p-5 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-accent/10 text-accent shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{doc.file_name}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatFileSize(doc.file_size)}
            </span>
          </div>
          <Badge variant="outline" className={`mt-2.5 text-xs ${categoryColors[doc.category] || categoryColors.Other}`}>
            {doc.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => onView(doc)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(doc)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
