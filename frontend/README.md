# 🎨 SmartHealth Frontend

The frontend for SmartHealth is a modern, responsive web application built with **React 19** and **Vite**. It features a friendly "Baymax-inspired" UI designed with **Tailwind CSS 4**.

## 🛠 Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **Icons/Visuals:** Lucide React (or similar) & Custom SVGs
- **Charts:** Recharts
- **API Client:** Axios
- **State Management:** React Context API (AuthContext)

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **npm 10+**

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

The application will be available at [http://localhost:5173](http://localhost:5173).

## 📁 Directory Structure

- `src/auth/`: Components, context, and services related to user authentication and profile.
- `src/components/`: Reusable UI components.
  - `chatbot/`: Chat interface components.
  - `dashboard/`: Health widgets and charts.
  - `customerservice/`: CSKH (Customer Service) widget.
- `src/pages/`: Top-level page components (Home, Dashboard, ChatPage).
- `src/services/`: Centralized API service configuration.

## 🎨 Styling & Theme

We use **Tailwind CSS 4** for styling. The theme focuses on:
- **Softness:** Rounded corners (`rounded-2xl`, `rounded-3xl`).
- **Aesthetics:** Glassmorphism effects, soft shadows, and a clean white/blue/red color palette.
- **Interactions:** Subtle hover effects and smooth transitions to mimic a friendly AI interface.

## 🔑 Environment Variables

For local development, you may need to configure the Google Client ID if using Google OAuth:

Create a `.env` file in the `frontend/` directory (if required by the implementation):
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

## 🏗 Build for Production

```bash
npm run build
```

The production-ready assets will be generated in the `dist/` folder.
