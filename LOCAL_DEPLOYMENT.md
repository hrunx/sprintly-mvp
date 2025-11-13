# Sprintly AI - Local Deployment Guide

This guide will help you deploy Sprintly AI on your local machine or server without any cloud dependencies.

## 🚀 Quick Start with Docker Compose

The easiest way to run Sprintly AI locally is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/hrunx/Gasable_Hub.git
cd Gasable_Hub
git checkout local2

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start the application
docker-compose up -d

# 4. Wait for services to start (about 30 seconds)
docker-compose logs -f app

# 5. Access the application
# Open http://localhost:3000 in your browser
```

### Default Login Credentials
```
Email: demo@sprintly.ai
Password: demo1234
```

## 📋 Manual Installation

If you prefer to run without Docker:

### Prerequisites
- Node.js 18+ and pnpm
- MySQL 8.0+
- OpenAI API key

### Step 1: Database Setup

```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# Start MySQL
sudo systemctl start mysql

# Create database
mysql -u root -p
CREATE DATABASE sprintly;
CREATE USER 'sprintly_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sprintly.* TO 'sprintly_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Application Setup

```bash
# Clone and checkout local2 branch
git clone https://github.com/hrunx/Gasable_Hub.git
cd Gasable_Hub
git checkout local2

# Install dependencies
pnpm install

# Configure environment variables
cat > .env << EOF
DATABASE_URL=mysql://sprintly_user:your_password@localhost:3306/sprintly
JWT_SECRET=$(openssl rand -base64 32)
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
PORT=3000
EOF

# Push database schema
pnpm db:push

# Seed demo data
node scripts/seed-local.mjs

# Start development server
pnpm dev
```

### Step 3: Access the Application

Open http://localhost:3000 and login with:
- Email: `demo@sprintly.ai`
- Password: `demo1234`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MySQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |

### Getting an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

## 🗄️ Database Management

### Push Schema Changes
```bash
pnpm db:push
```

### Reset Database
```bash
# Drop all tables and recreate
mysql -u sprintly_user -p sprintly < /dev/null
pnpm db:push
node scripts/seed-local.mjs
```

### Backup Database
```bash
mysqldump -u sprintly_user -p sprintly > backup.sql
```

### Restore Database
```bash
mysql -u sprintly_user -p sprintly < backup.sql
```

## 🧪 Testing

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
NODE_ENV=production pnpm start
```

## 🐳 Docker Commands

### View Logs
```bash
docker-compose logs -f app
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Access Database Container
```bash
docker exec -it sprintly-mysql mysql -u sprintly_user -p
```

## 📊 Seeding Data

The seed script creates:
- 1 demo user (demo@sprintly.ai)
- 3 sample companies seeking funding
- 3 sample investors
- AI-generated matches between companies and investors

To re-seed:
```bash
node scripts/seed-local.mjs
```

## 🔐 Security Notes

### Production Deployment

1. **Change JWT Secret**: Generate a strong random secret
   ```bash
   openssl rand -base64 32
   ```

2. **Use Strong Database Password**: Don't use default passwords

3. **Enable HTTPS**: Use a reverse proxy like nginx with Let's Encrypt

4. **Restrict Database Access**: Only allow localhost connections

5. **Set Secure Cookie Options**: Update `server/_core/cookies.ts`

### Example nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database Connection Failed
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Test connection: `mysql -u sprintly_user -p`

### OpenAI API Errors
- Verify API key is correct
- Check API quota: https://platform.openai.com/usage
- Ensure billing is set up

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v
# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Architecture

### Technology Stack
- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL 8.0 + Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **AI**: OpenAI GPT-4 for matching and analysis

### Key Features
- Email/password authentication (no OAuth)
- AI-powered company-investor matching
- Pitch deck analysis
- Network visualization
- CSV data import
- Configurable matching weights

## 🔄 Updating

```bash
# Pull latest changes
git pull origin local2

# Install new dependencies
pnpm install

# Update database schema
pnpm db:push

# Restart application
docker-compose restart
# OR for manual setup
pnpm dev
```

## 📞 Support

For issues or questions:
1. Check the [main README](./README.md) for feature documentation
2. Review [GitHub Issues](https://github.com/hrunx/Gasable_Hub/issues)
3. Contact the development team

## 📄 License

MIT License - See LICENSE file for details
