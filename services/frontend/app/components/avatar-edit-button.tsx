"use client";

import { useState } from "react";
import { ImageUploadModal } from "./image-upload-modal";
import { Pencil } from "lucide-react";
import { useAvatar } from "../context/AvatarContext";
import { getGatewayUrl } from "@/lib/gateway";

type AvatarEditButtonProps = {
  className?: string;
};

export default function AvatarEditButton({
  className = "",
}: AvatarEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setVersion } = useAvatar()!;

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    await fetch(getGatewayUrl("/api/v1/user-mgmt/me/avatar"), {
      method: "PUT",
      body: formData,
      credentials: "include",
    });
    setIsModalOpen(false);
    setVersion(Date.now())
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`rounded-full h-9 aspect-square ${className}`}
      >
        <Pencil className="h-5 aspect-square" />
      </button>

      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleImageUpload}
      />
    </>
  );
}
