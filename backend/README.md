# Excel Analytics - Backend

Express.js REST API service for Excel Analytics.

## Features
- **User Authentication**: Secure registration, login with JWT HTTP-only cookies, bcrypt password hashing.
- **Analysis History Management**: Cloud persistence of AI insights, charts, and summary statistics in MongoDB with automatic deduplication, per-user bounds, and full REST API (`/api/v1/user/history`).
- **Profile Management**: Profile image upload using Cloudinary stream upload via Multer memory storage.
- **AI Analytics**: Integration with Google Generative AI (Gemini) for automated spreadsheet analysis and natural language queries.
- **MongoDB Database**: Mongoose ODM with connection resilience, compound indexing, and schema validation.

## Environment Variables
Create `.env` with:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/excel-analytics
SECRET_KEY=your_jwt_secret_key
GEMNI_AI_API=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

`GEMINI_MODEL` is optional; the API defaults to `gemini-2.5-flash`. The insights endpoint treats the first data row as column headers and identifies when the client sends a truncated sample.

## Running the Server
```bash
npm install
npm run dev
```
