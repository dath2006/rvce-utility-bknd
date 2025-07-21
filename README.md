# RVCE Utility Backend

A backend service for RVCE Utility resource management platform. This project provides APIs and utilities for managing, uploading, and organizing college resources using Google Drive, with user authentication and contribution tracking.

## Features

- **Google Drive Integration**: Store and organize files in a structured folder hierarchy using Google Drive API (OAuth2 authentication).
- **User Authentication**: Secure access to resources and management features using NextAuth.
- **Contribution Management**: Users can upload, track, and manage their contributions (notes, documents, etc.).
- **Admin Tools**: Approve, reject, or review user contributions.
- **Resource Search & Organization**: Search, browse, and manage files and folders efficiently.
- **Notifications**: Telegram notifications for new uploads and contributions.

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud project with Drive API enabled
- OAuth2 credentials (Client ID, Client Secret, Refresh Token)

### Environment Variables

Create a `.env` file in the project root with the following:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_ROOT_FOLDER_ID=your_drive_root_folder_id
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_connection_string
TELEGRAM_BOT_TOKEN=your_telegram_bot_token (optional)
TELEGRAM_CHAT_ID=your_telegram_chat_id (optional)
```

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

## Usage

- **Drive Manager**: Browse, search, and manage files/folders in Google Drive.
- **Contribution Manager**: Review, approve, or reject user-submitted resources.
- **User Uploads**: Authenticated users can upload files, which are organized by subject, semester, and type.

## Project Structure

- `app/` - Next.js API routes and pages
- `lib/` - Google Drive integration, database models, utilities
- `components/` - UI components

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
