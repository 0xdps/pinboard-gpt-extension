# Pinboard GPT API Setup

## Prerequisites
- Node.js 18+ installed
- Turso account (https://turso.tech)
- Google Cloud Console project with OAuth 2.0 credentials

## Setup Steps

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Create Turso Database
```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create database
turso db create pinboard-gpt

# Get database URL
turso db show pinboard-gpt --url

# Create auth token
turso db tokens create pinboard-gpt
```

### 3. Setup Google OAuth
1. Go to https://console.cloud.google.com
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized origins:
   - https://api.pinboard-gpt.dps.codes
   - http://localhost:3000 (for development)
6. Copy the Client ID

### 4. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
TURSO_DATABASE_URL=libsql://your-db-name-your-username.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_random_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
PORT=3000
NODE_ENV=development
```

### 5. Push Database Schema
```bash
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

The API will be available at http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/google` - Sign in with Google
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password

### User
- `GET /user/profile` - Get user profile (requires auth)
- `GET /user/license` - Get license information (requires auth)
- `POST /user/activate` - Activate license key (requires auth)

### Pins (Premium only)
- `POST /pins/sync` - Upload pins to cloud
- `GET /pins/sync` - Download pins from cloud
- `DELETE /pins/:id` - Delete a pin

## Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Configure Environment Variables
In Vercel dashboard, add all environment variables from `.env`

### 4. Update Extension
Update `API_BASE_URL` in `extension/common/auth.js` to your Vercel deployment URL
