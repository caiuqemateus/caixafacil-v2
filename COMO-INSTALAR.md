# Instalar o Caixa Fácil no celular

1. Publique a pasta `dist/` (ou o projeto inteiro) em um host HTTPS gratuito:
   Netlify Drop (app.netlify.com/drop), Vercel ou GitHub Pages.
2. Abra o link no celular.
   - Android (Chrome): toque em "Instalar app" ou menu ⋮ > "Instalar aplicativo".
   - iPhone (Safari): Compartilhar > "Adicionar à Tela de Início".
3. Depois do primeiro acesso, funciona sem internet.

## Quer um APK de verdade? (opcional, no computador)
Precisa de Node e Android Studio:
  npm run build && npm i @capacitor/core @capacitor/cli @capacitor/android
  npx cap add android && npx cap sync && npx cap open android
No Android Studio: Build > Build APK(s).
