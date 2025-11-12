#!/bin/bash

# Pinboard GPT - Quick Setup Script

echo "🚀 Pinboard GPT API Setup"
echo "=========================="
echo ""

# Check if we're in the api directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the /api directory"
  echo "   cd api && bash setup.sh"
  exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from template..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo "⚠️  Please edit .env and fill in your credentials:"
  echo "   - TURSO_DATABASE_URL"
  echo "   - TURSO_DB_TOKEN"
  echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
  echo "   - GOOGLE_CLIENT_ID"
  echo ""
  echo "Press Enter when you've updated .env..."
  read
else
  echo "✅ .env file already exists"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18+ first."
  exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
echo "   Make sure you've created a Turso database and updated .env"
echo ""

# Try to push schema
echo "📤 Pushing database schema to Turso..."
npm run db:push

if [ $? -eq 0 ]; then
  echo "✅ Database schema pushed successfully!"
else
  echo "⚠️  Database push failed. Please check your Turso credentials in .env"
  echo "   To create a Turso database:"
  echo "   1. turso auth login"
  echo "   2. turso db create pinboard-gpt"
  echo "   3. turso db show pinboard-gpt --url"
  echo "   4. turso db tokens create pinboard-gpt"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Test health check: curl http://localhost:3000"
echo "   3. Deploy to Vercel: vercel --prod"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - api/README.md (setup guide)"
echo "   - api/DEPLOYMENT.md (deployment guide)"
echo "   - API_IMPLEMENTATION.md (API reference)"
