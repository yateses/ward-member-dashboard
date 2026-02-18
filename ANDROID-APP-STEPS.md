# Building the Android App – Beginner Steps

This guide walks you through putting the FH5 Members app on your Android phone step by step. You’ll use Android Studio to build and install the app.

---

## What you need before you start

- Your congregation-manager project on your computer (this folder).
- An **Android phone** (or you can use an emulator on your computer).
- About **30–45 minutes** the first time (downloads and setup).

---

## Step 1: Install Android Studio

Android Studio is the program that builds and installs the app on your phone.

1. Go to: **https://developer.android.com/studio**
2. Click **Download Android Studio**.
3. Run the installer and follow the prompts (you can leave the default options).
4. When it asks, install the **Android SDK** (Software Development Kit). This is required.
5. When the installer finishes, open **Android Studio**.

**First-time setup in Android Studio:**

- If it says “Import previous settings” or “Do not import,” choose **Do not import** (or either option if you’ve never used it).
- Click **Next** through the setup wizard.
- Choose **Standard** installation.
- Pick a theme (Light or Dark) and click **Finish**.
- Wait until it finishes downloading components (this can take several minutes). You’re done when you see the “Welcome to Android Studio” screen.

---

## Step 2: Prepare your Android phone (if using a real device)

To install the app on your phone, the phone must allow “developer” mode and “USB debugging.”

1. On your phone, open **Settings**.
2. Find **About phone** (might be under **System** or **General**).
3. Tap **About phone**.
4. Find **Build number** and tap it **7 times**. You should see a message like “You are now a developer!”
5. Go back to the main **Settings** screen.
6. Open **System** → **Developer options** (or search for “Developer options” in Settings).
7. Turn **Developer options** **On**.
8. In Developer options, find **USB debugging** and turn it **On**.
9. Connect your phone to your computer with a **USB cable**. When the phone asks “Allow USB debugging?” tap **Allow** (and you can check “Always allow from this computer”).

Your phone is ready. Leave it connected.

---

## Step 3: Build the web app

You need to build the website part of the app so the Android project can use it.

1. Open a **terminal** (or **Command Prompt** / **PowerShell**) on your computer.
2. Go to your project folder. For example:
   ```bash
   cd "c:\Users\yates\Documents\Bishop Ministery\congregation-manager"
   ```
   (Use your actual path if it’s different.)
3. Run:
   ```bash
   npm run build
   ```
4. Wait until it finishes. You should see something like “built in …” with no errors. That creates a `dist` folder with the built app.

---

## Step 4: Sync the web app into the Android project

This step copies the built website and plugin code into the Android project.

1. In the **same terminal**, in the **same project folder**, run:
   ```bash
   npx cap sync android
   ```
2. Wait until it says something like “Sync finished.” That’s it for this step.

---

## Step 5: Open the Android project in Android Studio

1. In the **same terminal**, in the **same project folder**, run:
   ```bash
   npx cap open android
   ```
2. Android Studio should open and load the project. The first time it may take a few minutes to “index” and “sync” (you’ll see progress at the bottom).
3. If it asks to update the “Android Gradle Plugin” or “Gradle,” you can click **Update** (or **Don’t remind me** if you prefer to skip for now).

---

## Step 6: Run the app on your phone

1. At the top of Android Studio, find the **device dropdown** (it might say “No devices” or the name of your phone or an emulator).
2. If your phone is connected with USB, click the dropdown and select **your phone’s name**.
3. Click the green **Run** button (play icon) next to the device dropdown.
4. Android Studio will build the app and install it on your phone. The first build can take a few minutes.
5. When it’s done, the app should open on your phone. You might see a prompt to allow notifications—tap **Allow** so the birthday/anniversary reminders work.

You now have the app on your phone. You can unplug the cable; the app stays installed.

---

## Step 7: Use the app and notifications

1. Open **FH5 Members** on your phone and **sign in** (same as on the website).
2. The app will load your members. If today is someone’s birthday or anniversary (and they have a phone number), the app will schedule a notification—usually for **8:00 AM** (or right away if it’s already past 8 AM).
3. **Notifications are delivered by your phone even when the app is closed.** You don’t need to leave the app open; just open it once (e.g. in the morning or the day before) so it can schedule that day’s reminders.
4. When the notification appears, you’ll see two options:
   - **Ignore** – dismiss it.
   - **Draft Text** – open your messaging app with the right person and a prefilled message (e.g. “Happy birthday [name]! I hope you have a wonderful day!!!”). You can edit the message and send it yourself.

For **under-18 birthdays**, the draft goes to the **head of household’s** number. For **anniversaries**, it goes to the **head of household** for that family.

---

## When you change the website and want to update the phone app

Whenever you change the Vue/website code and want those changes on your phone:

1. In the project folder, run:
   ```bash
   npm run build
   npx cap sync android
   ```
2. In Android Studio, click the green **Run** button again. It will install the updated app on the same device.

You don’t need to run “cap open android” again unless you closed Android Studio—just **build → sync → Run**.

---

## Quick reference – order of commands

| What you’re doing | Commands |
|-------------------|----------|
| First time: build and open in Android Studio | `npm run build` → `npx cap sync android` → `npx cap open android` |
| You changed the website and want to update the app | `npm run build` → `npx cap sync android` → then in Android Studio click **Run** |
| You only changed native Android code (e.g. in `android/` folder) | In Android Studio click **Run** (no need to run `npm run build` or `cap sync`) |

---

## Troubleshooting

- **“No devices” in Android Studio**  
  - Phone: Check USB cable and that USB debugging is on; try another cable or port.  
  - Emulator: In Android Studio, **Tools** → **Device Manager** → create a virtual device and start it; then choose it from the device dropdown.

- **Build fails in Android Studio**  
  - Try **File** → **Invalidate Caches** → **Invalidate and Restart**.  
  - Make sure you ran `npm run build` and `npx cap sync android` from the project folder first.

- **App crashes or notifications don’t show**  
  - Make sure you allowed notifications when the app asked.  
  - In phone **Settings** → **Apps** → **FH5 Members** → **Notifications**, ensure they’re enabled.

- **“SDK not found” or similar**  
  - In Android Studio: **File** → **Project Structure** (or **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**) and make sure an SDK is installed and the path is set.

If you hit a different error, note the exact message and where it appears (terminal vs Android Studio); that will help when searching or asking for help.
