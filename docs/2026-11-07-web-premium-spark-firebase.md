# RenéCare 365 – web Premium / Firebase Spark
Datum: 7. listopadu 2026. **Pracovní příprava, nic nezveřejňovat.**

## Ověřeno s uživatelem ve Firebase Console
- Projekt Firebase `revma-zdravi-365`, webová aplikace `RenéCare 365 – Web Premium`.
- Firebase Auth: zapnuto E-mail/Heslo a zachováno anonymní přihlašování.
- Autorizovaná doména: `renecare365.cz`.
- Firebase App Check: Android i Android TEST již registrované (Play Integrity).
- Web App Check nově registrován s reCAPTCHA Enterprise/Fraud Defense.
- Firestore App Check vynucen (Enforced); Auth App Check Monitoring.
- Tarif Spark; **NEZAPÍNAT Blaze ani placení**.
- Firestore současných sdílených katalogů funguje; `premium_accounts`,
  `premium_entitlements`, `users` ve snímku kolekcí vidět nebyly.
- Pravidla Firestore nyní obsahují finální deny-all, klientské DELETE v
  premium kolekcích není povoleno. **Pravidla neměnit bez testu a schválení.**
- Testovací e-mailový účet ve Firebase Auth byl vytvořen; **nemaže se**.

## Co je v této pracovní větvi připraveno
- `firebase-web-config.js` obsahuje veřejnou konfiguraci skutečné Firebase
  Web App včetně veřejného App Check reCAPTCHA Enterprise site key.
  Klíče jsou veřejné identifikátory; nejsou to admin/privátní klíče.
- `smazani-uctu.js` inicializuje Firebase App Check před použitím Auth a
  Firestore; importuje oficiální SDK verze 13.2.0.
- Dvě pojistky: `accountDeletionEnabled: false` v konfiguraci; JavaScript
  nechává tlačítko neaktivní a odmítá také přímé odeslání formuláře.
- Až po auditu lze zapnout web a Android. Neexistuje ověřený test výsledku
  úplného mazání účtu ani serverových dat.
- Webová pracovní větev `feat/web-spark-mazani-2026-11-07` nesmí být
  předčasně připojena k veřejnému GitHub Pages `main`.

## Nutné před zapnutím funkce
1. Audit a test Firestore rules: vlastník smí mazat jen vlastní UID, klient
   nesmí měnit práva Premium; staré verze a společné katalogy beze změny.
2. Audit skutečných soukromých dat, podkolekcí, sdílených návrhů a záloh.
   `delete(doc)` nesmaže podkolekce; Firestore -> Firebase Auth není
   atomické; je nutné testovat opakování a síťová selhání.
3. Test App Check na reálné doméně `renecare365.cz`; v debug/testovací
   doméně používat vyhrazený debug režim, ne rozšiřovat produkční klíč o localhost.
4. Test vytvoření a následného smazání vlastního testovacího Firebase účtu
   webem i Androidem, kontrola výsledků ve Firestore a Auth.
5. Pravdivá stránka mazání účtu a zásady soukromí pro Google Play; test
   přístupnosti veřejné URL. Nepublikovat formulář se slibem smazání,
   dokud není úplný postup funkční.
6. Odděleně otestovat serverový nárok Premium; zatím se nesmí umožnit
   klientovi přiznávat sobě placené Premium ani testovací doživotní nárok.

## Zálohy a větve
- Android backup: `backup/premium-pred-spark-mazanim-2026-11-07`.
- Web backup: `backup/web-pred-spark-mazanim-2026-11-07`.
- Android: `feat/premium-spark-mazani-2026-11-07`.
- Web: `feat/web-spark-mazani-2026-11-07`.
- Web `main` ani Android vydaná verze 111 se touto přípravou nemění.
