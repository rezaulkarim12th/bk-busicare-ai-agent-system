# Google Play release preparation

## Current Android identity
- App display name: BK-BusiCare
- Application ID: `com.bkbusicare.app`
- Web app source: this repository
- Android release target: Android 16 / API 36 (Capacitor 8)
- Required Play artifact: signed Android App Bundle (`.aab`)

The application ID is a permanent Play identity once the first bundle is uploaded. Confirm that the Play Console app was created with exactly `com.bkbusicare.app` before uploading any bundle.

## Signed bundle workflow
The manual GitHub Actions workflow `.github/workflows/google-play-aab.yml` builds the web app, generates a Capacitor 8 Android project, checks compile/target SDK 36, and creates a signed release AAB.

The workflow requires these repository Actions secrets:
- `PLAY_UPLOAD_KEYSTORE_BASE64`: base64-encoded upload keystore file
- `PLAY_UPLOAD_STORE_PASSWORD`: keystore password
- `PLAY_UPLOAD_KEY_ALIAS`: upload key alias
- `PLAY_UPLOAD_KEY_PASSWORD`: upload key password

The app owner must create and securely retain the upload keystore and configure these secrets in GitHub. Never commit the keystore or passwords, put them in browser code, or send them in chat. Keep a secure offline backup. If the upload key is lost, key reset must be handled through Play Console's supported process.

Run the workflow manually from Actions > Google Play Android App Bundle > Run workflow. The resulting AAB is stored as a short-lived workflow artifact for download. This workflow does not publish to Google Play.

## Play Console owner tasks
The adult Play Console account owner must:
1. Confirm the Play app package name is exactly `com.bkbusicare.app`.
2. Complete developer identity and app ownership checks.
3. Configure Play App Signing and upload the AAB to Internal testing first.
4. Complete app access instructions, privacy policy, Data safety, content rating, target audience, ads declaration, app category, contact details and store listing.
5. Review all declarations against actual app behavior and data processing. Do not guess Data safety answers.
6. Test the uploaded build on supported devices and resolve all Play pre-launch report findings.
7. Use Closed testing if required by the account's eligibility rules.

For new personal developer accounts created after 13 November 2023, Google currently requires at least 12 opted-in testers continuously for 14 days before applying for Production access. Check the account's own Play Console dashboard because eligibility rules depend on account type and creation date.

## Release blockers not solved by building an AAB
- Live signup/login/password recovery and authenticated AI generation have not been fully accepted end-to-end.
- The product status document records CRM/commerce/integration features that are incomplete or unverified.
- Privacy policy and Data safety declarations must be based on verified current data flows, SDK inventory, retention, deletion, and third-party processing.
- Store listing graphics, screenshots, feature graphic, support contact, and public privacy-policy URL need owner approval.
- App versionCode must be unique and increased for each upload. Check the Play Console's current highest version code before release.
- The owner must review the Play Console warnings and submit the release. This workflow cannot submit or publish the app.

## Safety boundary
The GitHub Pages app and TEST Supabase project remain separate from Production. This workflow does not deploy or modify either Supabase project. Do not use real customer data in testing.
