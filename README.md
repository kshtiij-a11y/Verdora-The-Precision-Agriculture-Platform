# AgriAssist SMS

AgriAssist SMS is an AI-powered, multilingual advisory platform designed to empower farmers by delivering critical, real-time information directly to their mobile phones via SMS. It bridges the digital divide by providing actionable insights on weather, crop health, and market prices, helping farmers make informed decisions, increase yield, and improve their livelihoods.

The platform features two distinct portals: an **Admin Portal** for registering farmers and managing alerts, and a **Farmer Portal** that provides a localized, user-friendly interface for farmers to access information themselves.

![AgriAssist SMS Landing Page](https://storage.googleapis.com/aifirebase-preview-build-artifacts/landing-page.png)

## Key Features

- **Farmer Registration & Management**: Admins can register farmers with details like location, phone number, and primary/secondary crops.
- **AI-Powered Weather Forecasts**: Get concise, actionable weather summaries for any location, translated into the farmer's preferred language.
- **AI Crop Health Diagnosis**: Upload a photo of a plant to get an AI-driven diagnosis of potential diseases or pests, along with recommended actions.
- **Advisory & Pest Alerts**: Admins can generate and broadcast critical alerts about potential threats like pest infestations or adverse weather events.
- **Market Price Guidance**: Access indicative mandi (market) rates for key crops to support selling decisions.
- **Multilingual Support**: All information and alerts can be translated into 10 different Indian languages, with both text and voice (Text-to-Speech) output.
- **SMS Integration**: Powered by Twilio, the platform delivers all generated insights directly to any mobile phone, ensuring accessibility for all farmers.
- **AI Chat Assistant**: A knowledgeable chatbot that can answer farming-related questions about weather, market prices, crop diseases, and more.
- **Government ID Verification**: An AI-powered tool to verify a farmer's identity by scanning their government-issued ID card.

## How It Works

1.  **Register Farmer**: An administrator or field agent registers a farmer using the dashboard, capturing their location, crops, and preferred language. The system includes an AI-powered ID verification step for authenticity.
2.  **Generate Insight**: Using the various tools, the admin can generate a weather forecast, a crop diagnosis from a photo, or a pest advisory alert. The information is tailored to the farmer's context.
3.  **Translate & Send SMS**: The generated insight is translated into the farmer's local language and sent directly to their registered mobile number as an SMS. The farmer can also listen to the message using the Text-to-Speech feature in the portal.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Generative AI**: [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
- **SMS Service**: [Twilio](https://www.twilio.com/)
- **Database**: [Firestore](https://firebase.google.com/docs/firestore) (for farmer registrations)
- **Deployment**: Firebase App Hosting

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later)
- An active [Google Cloud / Firebase Project](https://firebase.google.com/)
- A [Twilio Account](https://www.twilio.com/try-twilio) with a Messaging Service SID
- API Keys for:
  - Google Gemini
  - OpenWeatherMap
  - NewsAPI.org

### Installation & Setup

1.  **Clone the repository** (if you have access to the git repo):
    ```bash
    git clone <your-repository-url>
    cd agri-assist-sms
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the root of your project and add the following variables with your credentials. You can get the Firebase config from your project settings in the Firebase console.

    ```env
    # Twilio Credentials
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key

    # External Service API Keys
    OPENWEATHER_API_KEY=your_openweathermap_api_key
    NEWS_API_KEY=your_newsapi_key

    # Firebase Configuration (from your Firebase project settings)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-xxxxxxxxxx
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

    The application should now be running at `http://localhost:9002`.

## Project Structure

- `src/app/`: Main application routes and pages using the Next.js App Router.
- `src/ai/`: Contains all Genkit flows (`flows/`) and tools (`tools/`) for interacting with the Gemini AI model.
- `src/components/`: Reusable React components, including UI components from ShadCN.
- `src/context/`: React Context providers for managing global application state (e.g., registered farmer, language).
- `src/hooks/`: Custom React hooks, such as `useTranslation`.
- `src/lib/`: Utility functions and Firebase configuration.
- `src/translations/`: JSON files for multilingual support.
- `public/`: Static assets.
