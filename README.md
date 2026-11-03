# 🌿 NoteNest — Your Thoughts, Your Space

**NoteNest** is a modern, personalized note-taking and productivity web application designed to help users capture ideas, organize information, manage everyday tasks, and maintain a clutter-free digital workspace.

Built with a clean interface, a calming sage-green aesthetic, and account-based privacy, NoteNest brings note-taking and task organization together in one place.

---

## ✨ Features

### 🔐 Authentication & User Privacy
- User registration and login.
- JWT-based authentication.
- Secure password hashing using bcrypt.
- Individual user accounts and personal workspaces.
- User-specific notes and data access.
- Persistent login sessions.
- Secure logout functionality.

### 📝 Note Management
- Create, edit, view and delete notes.
- Rich-text editing with Bold, Italic and Underline.
- Heading and paragraph formatting.
- Bullet and numbered lists.
- Automatic saving of note changes.
- Customizable note colors.
- Categories and tags for organization.

### ✅ Checklist Management
- Create and manage checklist notes.
- Add and complete individual tasks.
- Track task completion progress.
- Visual progress indicators.

### 📌 Organization & Productivity
- Pin important notes.
- Archive notes and restore them when needed.
- Dedicated Trash section.
- Restore deleted notes.
- Permanently delete notes.
- Automatic deletion of trashed notes after 30 days.

### 🔍 Search & Filtering
- Search notes by title and content.
- Filter notes by category and tags.
- Sort by creation date, last updated, title and recently viewed.
- Grid and list viewing modes.

### 🎨 User Interface
- Minimalist sage-green and off-white visual theme.
- Premium login and registration interface.
- Interactive hover effects and transitions.
- Dark mode support.
- Responsive layout for different screen sizes.
- Toast notifications and confirmation dialogs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS3 |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| HTML Sanitization | DOMPurify, sanitize-html |

---

## 📁 Project Structure

```text
NoteNest/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── auth/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── AuthGate.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── NoteSection.jsx
│   │   │   ├── NoteEditor.jsx
│   │   │   ├── RichTextEditor.jsx
│   │   │   ├── ChecklistEditor.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── ColorPicker.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── constants.js
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── dashboard.css
│   │   └── editor.css
│   │
│   └── package.json
│
├── server/
│   ├── middleware/
│   │   ├── authenticate.js
│   │   └── validateId.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Note.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   └── notes.js
│   │
│   ├── utils/
│   │   └── sanitize.js
│   │
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

- [Node.js](https://nodejs.org/) (18 or newer)
- npm
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or a MongoDB Atlas cluster.
- Visual Studio Code (recommended)

### 1. Clone the repository

```bash
git clone https://github.com/RajvardhanDewasi/NoteNest
```

Navigate into the project:

```bash
cd NoteNest
```

### 2. Backend setup

Navigate to the server folder:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the server directory.

```env
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/notenest

JWT_SECRET=your_long_random_secret_key
```

Generate a secure JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`.

Start the backend:

```bash
npm run dev
```

The backend should start at:

```text
http://localhost:5000
```

### 3. Frontend setup

Open a second terminal from the project root:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the client folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

## 🔑 Authentication & Data Privacy

NoteNest uses account-based authentication to maintain separate user workspaces.

- Each registered account has its own user identity.
- Passwords are stored as secure hashes rather than plain text.
- JWT tokens authenticate requests to protected API endpoints.
- Notes are associated with their respective owners.
- Backend ownership checks restrict access to the authenticated user's notes.

**Note:** Existing notes created before account-based ownership was introduced may require a data migration before they can appear in individual accounts.

Never commit `.env` files, database credentials or JWT secrets to GitHub.

---

## 🔌 API Overview

### Authentication Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the authenticated user |

### Notes Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | Retrieve notes |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Retrieve an individual note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Move a note to Trash |
| PATCH | `/api/notes/:id/pin` | Pin or unpin a note |
| PATCH | `/api/notes/:id/archive` | Archive a note |
| PATCH | `/api/notes/:id/restore` | Restore a deleted note |
| DELETE | `/api/notes/:id/permanent` | Permanently delete a note |
| GET | `/api/notes/meta/counts` | Retrieve dashboard counts |
| GET | `/api/notes/meta/tags` | Retrieve available tags |

Protected notes endpoints require a valid authentication token.

---

## 🚧 Future Enhancements

The following improvements are planned for future releases:

- [ ] Public landing page introducing NoteNest.
- [ ] Dedicated account profile and settings page.
- [ ] Profile picture and personalization options.
- [ ] Password reset functionality.
- [ ] Email verification.
- [ ] Improved dashboard analytics and productivity widgets.
- [ ] Advanced search and filtering.
- [ ] Additional editor customization.
- [ ] Cloud deployment and production optimization.

---

## 🎯 Project Status

**Current Stage:** Active Development

NoteNest currently focuses on providing a personalized note-taking experience with authentication, individual workspaces, rich-text editing, task management, note organization and a refined user interface.

The project is continuously evolving, with further improvements planned for usability, visual design, security and functionality.

---

## 🤝 Contributing

Contributions and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Commit your changes.
5. Push your branch.
6. Open a Pull Request.

Please test your changes before submitting a contribution.

---

## 📄 License

This project is currently developed for educational and project purposes.

A formal open-source license can be added when the project is ready for public distribution.

---

**Made with 💚 by the NoteNest Team**

*Your thoughts. Your space. Your NoteNest.*
