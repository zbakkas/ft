"use client";

import LanguageDropdown from "@/app/components/laguages-dropdown";
import { useLang } from "../context/LangContext";

export default function Translated() {
  const {lang} = useLang()!;
  if (lang === "eng") {
    return (
      <>
        <LanguageDropdown lan={lang} />
        {/* <h4>Change Password</h4> */}
        {/* <h4>Privacy Policy</h4> */}
        {/* <h4 className="text-red-700">Delete Account</h4> */}
      </>
    );
  } else {
    return (
      <>
        <LanguageDropdown lan={lang} />
        {/* <h4>Changer mot de passe</h4> */}
        {/* <h4>confidentialité</h4> */}
        {/* <h4 className="text-red-700">Supprimer le compte</h4> */}
      </>
    );
  }
}