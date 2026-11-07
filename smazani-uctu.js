// RenéCare 365 — samoobslužné smazání účtu přes ověřenou Cloud Function.
// NEZVEŘEJŇOVAT, dokud není nakonfigurovaný web Firebase projekt,
// nasazená funkce deletePremiumAccount a provedený test účtu na serveru.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, reload, getIdToken,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-functions.js";

const form = document.getElementById("delete-form");
const button = document.getElementById("delete-button");
const status = document.getElementById("status");
let auth = null;
let deleteAccount = null;

function show(message, type = "") {
  status.textContent = message;
  status.className = "status" + (type ? " " + type : "");
}

try {
  // Konfigurace veřejné webové aplikace z Firebase Console.
  // Soubor se musí přidat až po registraci webové aplikace v projektu.
  const module = await import("./firebase-web-config.js");
  const config = module.firebaseConfig;
  if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase web configuration is missing");
  }
  const app = initializeApp(config);
  auth = getAuth(app);
  deleteAccount = httpsCallable(getFunctions(app, "europe-west1"), "deletePremiumAccount");
  button.disabled = false;
  show("Bezpečné mazání je připravené. Potvrďte své údaje a smazání.");
} catch (error) {
  // Bez kompletní konfigurace NIKDY nenabízet zdánlivě funkční mazání.
  button.disabled = true;
  show("Automatické mazání účtů ještě není aktivované. Účet zatím nelze smazat touto stránkou.", "error");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth || !deleteAccount) return;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password || !document.getElementById("confirm").checked) return;
  button.disabled = true;
  show("Ověřuji totožnost a bezpečně mažu účet…");
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    await reload(user);
    if (!user.emailVerified) {
      throw new Error("Nejdříve musíte ověřit e-mailovou adresu účtu.");
    }
    await getIdToken(user, true);
    const response = await deleteAccount({ uid: user.uid, confirm: "SMAZAT_UCET" });
    if (response.data?.deleted !== true) throw new Error("Server nepotvrdil smazání.");
    await signOut(auth).catch(() => {});
    form.reset();
    form.hidden = true;
    show("Účet Premium a jeho soukromé serverové záznamy byly smazány.", "good");
  } catch (error) {
    // Nerozlišujeme chybné jméno nebo heslo (ochrana před zjišťováním účtů).
    const msg = typeof error?.message === "string" ? error.message : "";
    const text = msg.includes("ověřit e-mailovou") ? msg :
      error?.code === "functions/unauthenticated" ?
      "Z bezpečnostních důvodů se prosím znovu přihlaste." :
      "Smazání nebylo potvrzeno. Zkontrolujte přihlášení a zkuste to znovu.";
    show(text, "error");
    await signOut(auth).catch(() => {});
    button.disabled = false;
  } finally {
    document.getElementById("password").value = "";
  }
});
