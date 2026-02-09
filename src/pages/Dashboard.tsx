import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DocumentCard from "@/components/DocumentCard";
import UploadDialog from "@/components/UploadDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Loader2, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Resume", "Photo", "ID", "Certificate", "Other"];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tables<"documents"> | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading documents", description: error.message, variant: "destructive" });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.file_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "All" || doc.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [documents, search, activeCategory]);

  const handleView = async (doc: Tables<"documents">) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast({ title: "Error", description: "Could not open document.", variant: "destructive" });
    }
  };

  const handleDownload = async (doc: Tables<"documents">) => {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60, { download: true });

    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = doc.file_name;
      a.click();
    } else {
      toast({ title: "Error", description: "Could not download document.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([deleteTarget.file_path]);

    if (storageError) {
      toast({ title: "Error", description: storageError.message, variant: "destructive" });
      return;
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", deleteTarget.id);

    if (dbError) {
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${deleteTarget.file_name} has been removed.` });
      fetchDocuments();
    }
    setDeleteTarget(null);
  };

  const stats = useMemo(() => {
    const total = documents.length;
    const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
    return { total, totalSize };
  }, [documents]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground hidden sm:block">
              {stats.total} document{stats.total !== 1 ? "s" : ""} · {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">My Documents</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your personal document vault</p>
              </div>
              <Button
                onClick={() => setUploadOpen(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      activeCategory === cat
                        ? "bg-accent text-accent-foreground border-accent"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Document list */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-4 rounded-2xl bg-muted mb-4">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">No documents found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {documents.length === 0
                    ? "Upload your first document to get started"
                    : "Try adjusting your search or filters"}
                </p>
                {documents.length === 0 && (
                  <Button variant="outline" onClick={() => setUploadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={fetchDocuments} />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        fileName={deleteTarget?.file_name || ""}
        onConfirm={handleDelete}
      />
    </SidebarProvider>
  );
}
