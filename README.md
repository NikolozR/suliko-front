# Suliko Translation Platform

Suliko is a modern web-based translation platform built with Next.js that provides powerful translation capabilities with support for both text and document translations. The platform offers a user-friendly interface available in English (en) and Georgian (ka) languages.

## Features

- **Text Translation**: Real-time translation of text content
- **Document Translation**: Support for document uploads and translations
- **Chat Interface**: Interactive chat-based translation experience
- **History Tracking**: Keep track of your translation history
- **Multiple File Formats**: Support for various document formats
- **User Profiles**: Personalized user experience with profile management
- **Responsive Design**: Works seamlessly across different devices
- **Dark/Light Theme**: Customizable UI theme
- **Rich Text Editor**: Built-in editor for text formatting and editing

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **State Management**: Custom stores
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Internationalization**: Built-in i18n support

## Project Structure

```
suliko-front/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── features/      # Feature-based modules
│   ├── i18n/         # Internationalization setup
│   ├── shared/       # Shared components and utilities
│   └── hooks/        # Custom React hooks
├── messages/         # Translation messages
└── public/          # Static assets
```

## Features Overview

### Translation Services
- Text translation with real-time suggestions
- Document translation with format preservation
- Multiple language pair support
- Translation history tracking

### User Management
- User authentication and authorization (currently supports Georgian phone numbers only)
- Profile management
- Subscription and pricing plans

### Document Handling
- Multiple format support
- Document preview
- Download in various formats
- Page count tracking

### Editor
- Rich text formatting capabilities
- Real-time preview
- Support for various text styles and formatting options
- Seamless integration with translation features

## Security & Intellectual Property

This is a proprietary software platform with several security measures in place:
- Backend API endpoints are secured and require valid authentication
- Translation services are tied to our proprietary backend implementation
- Core business logic and translation algorithms are not part of the frontend codebase
- User data and translations are stored securely in our protected infrastructure
- The application requires valid API keys and service credentials to function

## Legal Notice

This software is protected by copyright and intellectual property laws. The source code, design, and all associated assets are proprietary and confidential. Any unauthorized use, reproduction, or distribution is strictly prohibited and may result in legal action.

## Support

For support and inquiries, please contact the Suliko support team.