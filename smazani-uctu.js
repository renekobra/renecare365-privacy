// RenéCare 365 — PRACOVNÍ verze mazání na Firebase Spark (bez Cloud Functions).
// NEZVEŘEJŇOVAT před ověřením pravidel Firestore, App Check, všech datových
// cest, pokrytí podkolekcí a kompletního testu Android + web.
// Tento soubor je pouze na pracovní větvi; veřejný web zůstává beze změn.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, deleteUser,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore, doc, writeBatch,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import {
  initializeAppCheck, ReCaptchaEnterpriseProvider,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-check.js";

const PRIVATE_COLLECTIONS = Object.freeze([
  "premium_accounts",
  "premium_entitlements",
  "users",
]);
// POZOR: mazání dokumentu Firestore automaticky nesmaže jeho podkolekce.
// Tyto tři kolekce nesmějí mít uživatelské podkolekce bez zvláštního řešení.

const form = document.getElementById("delete-form");
const button = document.getElementById("delete-button");
const status = document.getElementById("status");
let auth = null;
let db = null;

function show(message, type = "") {
  status.textContent = message;
  status.className = "status" + (type ? " " + type : "");
}

try {
  // Konfigurace je veřejná Firebase Web config (NIKDY admin service account).
  const module = await import("./firebase-web-config.js");
  const config = module.firebaseConfig;
  if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
    throw new Error("Web Firebase config nebyla nastavena");
  }
  const app = initializeApp(config);
  // Pro produkci s vynucenou ochranou Firestore App Check je nutný webový
  // veřejný site key a registrace webové aplikace ve Firebase App Check.
  if (config.appCheckSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  auth = getAuth(app);
  db = getFirestore(app);
  button.disabled = false;
  show("Pro bezpečné smazání se přihlaste a potvrďte svůj požadavek.");
} catch (error) {
  button.disabled = true;
  show("Automatické mazání účtů ještě není aktivované.", "error");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth || !db) return;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmed = document.getElementById("confirm").checked;
  if (!email || !password || !confirmed) return;

  button.disabled = true;
  show("Ověřuji přihlášení a mažu soukromé údaje…");
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // Nevyžadujeme potvrzení e-mailu. Smazat lze i nedokončenou registraci.
    // Právě provedené přihlášení splňuje požadavek čerstvého ověření pro Auth.
    const uid = user.uid;
    const batch = writeBatch(db);
    for (const collectionName of PRIVATE_COLLECTIONS) {
      batch.delete(doc(db, collectionName, uid));
    }

    // Až server potvrdí všechna 3 smazání, odstraňujeme Firebase Auth účet.
    // Pokud pravidla Firestore nepovolí smazat vlastní data, účet zůstává.
    await batch.commit();
    await deleteUser(user);
    await signOut(auth).catch(() => {});
    form.reset();
    form.hidden = true;
    show("Přihlašovací účet Premium a jeho známé soukromé serverové záznamy byly smazány.", "good");
  } catch (error) {
    // Nesmíme prozrazovat, zda konkrétní e-mail existuje.
    const msg = error?.code === "permission-denied" ?
      "Smazání serverových údajů nebylo povoleno. Účet zůstal zachován; kontaktujte podporu." :
      "Smazání nebylo kompletně potvrzeno. Zkontrolujte přihlášení a zkuste to znovu.";
    show(msg, "error");
    await signOut(auth).catch(() => {});
    button.disabled = false;
  } finally {
    document.getElementById("password").value = "";
  }
});
