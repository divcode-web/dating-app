"use client";

import { useState, useRef } from "react";
import { X, Camera, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

interface StoryUploadProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

export function StoryUpload({ onClose, onUploadComplete }: StoryUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (10MB max for faster mobile uploads)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${sizeMB}MB) exceeds 10MB limit. Please compress or choose a smaller file.`);
      return;
    }

    setFile(selectedFile);
    setMediaType(type);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !mediaType) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("media_type", mediaType);
      formData.append("caption", caption);
      formData.append("duration", mediaType === "video" ? "10" : "5");

      const response = await fetch("/api/stories/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload story");
      }

      onUploadComplete();
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Add to Your Story</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!preview ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Share a moment with your matches
              </p>

              {/* Upload options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-pink-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-pink-500 mb-2" />
                  <span className="font-medium">Photo</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG</span>
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Video className="w-12 h-12 text-purple-500 mb-2" />
                  <span className="font-medium">Video</span>
                  <span className="text-xs text-gray-500 mt-1">MP4, MOV</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "image")}
                className="hidden"
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, "video")}
                className="hidden"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your story will be visible to your matches for 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden bg-black">
                {mediaType === "image" ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {caption.length}/200 characters
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setMediaType(null);
                    setCaption("");
                    setError(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={uploading}
                >
                  Change
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Share Story"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
