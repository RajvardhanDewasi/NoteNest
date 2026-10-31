# NoteNest

A simple notes app inspired by Google Keep, built with the MERN stack (MongoDB, Express, React + Vite, Node.js).

**Features:** create, view, edit, search, pin and sort notes; six note colors; Personal / College / Work categories; archive and recoverable trash; locally autosaved drafts; keyboard search shortcuts; responsive layout; saved view preferences; loading, success and error messages.

## Prerequisites

1. **Node.js 18 or newer** - https://nodejs.org (check with `node -v`)
2. **MongoDB Community Server** (local) - https://www.mongodb.com/try/download/community
   - On Windows, install it with the default options and keep "Install MongoDB as a Service" ticked. It then starts automatically on `mongodb://127.0.0.1:27017`.
   - Check it is running: open *Services* (Win + R, type `services.msc`) and look for **MongoDB Server** with status *Running*.

## Setup (Windows, Command Prompt or PowerShell)

### 1. Backend

```
cd NoteNest\server
copy .env.example .env
npm install
npm start
```

You should see `Connected to MongoDB` and `NoteNest API running on http://localhost:5000`.

### 2. Frontend (open a second terminal)

```
cd NoteNest\client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Environment variables

`server/.env`

| Variable | Default | Meaning |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/notenest` | MongoDB connection string |
| `PORT` | `5000` | API port |

`client/.env` is optional. Only create it if the API is not at `http://localhost:5000/api`:

```
VITE_API_URL=http://localhost:5000/api
```

### Using MongoDB Atlas instead of local MongoDB

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Under *Database Access*, create a database user. Under *Network Access*, allow your IP address.
3. Click *Connect -> Drivers* and copy the connection string.
4. Put it in `server/.env`, adding the database name `notenest` before the `?`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/notenest?retryWrites=true&w=majority
   ```
5. Never commit `.env` to Git.

## Using the app

- **Create:** click *Take a note...*, enter a title (required) and description, pick a color and category, then *Save note*.
- **Search:** type in the header search bar. It matches title or description.
- **Filter:** use the All / Personal / College / Work chips.
- **Edit:** click *Edit* on a card, change the fields, then *Save changes*.
- **Delete:** click *Delete* on a card and confirm.
- **Pin / sort:** pin notes to keep them at the top, then choose newest, oldest, or title order.
- **Archive / trash:** archive notes to remove them from the main list. Delete moves a note to Trash, where it can be restored or permanently removed.
- **Drafts:** unfinished notes are saved in this browser and restored when you return to the composer.
- **Keyboard:** press **Ctrl/Cmd + K** or **/** to focus search; press **Escape** to close a dialog or clear a focused search.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notes` | All notes (optional `?search=text`) |
| GET | `/api/notes/:id` | One note |
| POST | `/api/notes` | Create (`title` required; `content`, `color`, `category` optional) |
| PUT | `/api/notes/:id` | Update |
| DELETE | `/api/notes/:id` | Delete |

Status codes: 200 OK, 201 Created, 400 invalid input or ID, 404 not found, 500 server error.

## Project structure

```
NoteNest/
├── client/            React + Vite frontend
│   └── src/
│       ├── components/  NoteForm, NoteCard, EditModal, ConfirmDialog, ColorPicker, Toast
│       ├── api.js       Axios calls to the backend
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── server/            Express + Mongoose backend
│   ├── models/Note.js
│   ├── routes/notes.js
│   ├── middleware/validateId.js
│   └── server.js
├── README.md
└── .gitignore
```

## Troubleshooting

- **"Could not connect to MongoDB"** - start the MongoDB service, or fix `MONGODB_URI`.
- **"Cannot reach the server" in the browser** - the backend is not running or the port differs from `VITE_API_URL`.
- **Port already in use** - change `PORT` in `server/.env` and set `VITE_API_URL` in `client/.env` to match.
- **CORS error** - the API allows `http://localhost:5173`. If Vite uses another port, update the `cors` origin in `server/server.js`.
