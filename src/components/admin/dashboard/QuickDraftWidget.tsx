import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { FeedItem } from "./ActivityFeed";

interface QuickDraftWidgetProps {
  onDraftSaved?: (item: FeedItem) => void;
}

const QuickDraftWidget = ({ onDraftSaved }: QuickDraftWidgetProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const { error } = await supabase.from("blog_posts").insert({
      title: title.trim(),
      slug,
      content: content.trim() || null,
      status: "draft",
      user_id: user?.id || null,
    });
    if (error) {
      toast.error("Failed to save draft.");
    } else {
      toast.success("Draft saved!");

      // Push to activity feed
      onDraftSaved?.({
        id: `draft-${Date.now()}`,
        icon: FileText,
        color: "#2271b1",
        text: `Draft created: "${title.trim()}"`,
        time: new Date(),
        link: "/admin/posts",
      });

      setTitle("");
      setContent("");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-lg border border-[#dcdcde]">
      <div className="px-5 py-4 border-b border-[#dcdcde] flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">Quick Draft</h3>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={200}
            className="h-9 text-sm border-gray-300"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a quick draft…"
            rows={4}
            maxLength={5000}
            className="text-sm border-gray-300 resize-none"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm h-9"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save Draft"}
        </Button>
      </div>
    </div>
  );
};

export default QuickDraftWidget;
