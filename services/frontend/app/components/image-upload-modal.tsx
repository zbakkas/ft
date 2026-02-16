"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../context/LangContext";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
}: ImageUploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang()!;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert(lang === "eng" ? "Please select a valid image file (JPEG, PNG)" : "Veuillez sélectionner un fichier image valide (JPEG, PNG)");
      return;
    }

    // Validate image is square
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        if (img.width !== img.height) {
          alert(lang === "eng"
            ? "Please select a square image (width and height must be equal)"
            : "Veuillez sélectionner une image carrée (largeur et hauteur doivent être égales)");
          return;
        }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      };
      img.onerror = () => {
        alert(lang === "eng" ? "Could not load image." : "Impossible de charger l'image.");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragOver(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-72 sm:max-w-72 md:max-w-md lg:max-w-md">
        <DialogHeader>
          <DialogTitle>{lang === "eng" ? "Upload Image" : "Télécharger l'image"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {lang === "eng" ? "Drag and drop your image here, or click to browse" : "Glissez-déposez votre image ici, ou cliquez pour parcourir"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "eng" ? "Supports: JPEG, PNG" : "Formats pris en charge : JPEG, PNG"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "eng"
                    ? "Image must be square (width = height)"
                    : "L'image doit être carrée (largeur = hauteur)"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl! || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 bg-red-700 rounded-full aspect-square"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(2)} {lang === "eng" ? "Kb" : "Ko"})
                </span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              {lang === "eng" ? "Cancel" : "Annuler"}
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>
              {lang === "eng" ? "Upload" : "Télécharger"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
