# 🚀 Sprintly AI - Deployment Guide

Complete guide to deploy Sprintly AI locally or to production.

---

## 📋 Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **MySQL** or **MariaDB** database
- **OpenAI API Key** (get from [platform.openai.com](https://platform.openai.com/api-keys))

---

## ⚡ Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/hrunx/Gasable_Hub.git
cd Gasable_Hub
git checkout local2
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the minimal template
cp .env.minimal .env
```

Edit `.env` and add your values:

```env
DATABASE_URL=mysql://root:password@localhost:3306/sprintly
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### 4. Set Up Database

Create the database:

```bash
mysql -u root -p
CREATE DATABASE sprintly;
EXIT;
```

Push the schema:

```bash
pnpm db:push
```

### 5. Seed Demo Data (Optional)

```bash
node scripts/seed-local.mjs
```

This creates:
- Demo user: `demo@sprintly.ai` / `demo1234`
- 3 sample companies
- 3 sample investors
- 3 AI-generated matches

### 6. Start the Application

```bash
pnpm dev
```

Visit **http://localhost:3000** and login with:
- Email: `demo@sprintly.ai`
- Password: `demo1234`

---

## 🐳 Docker Deployment (Alternative)

### Using Docker Compose

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The app will be available at **http://localhost:3000**

---

## 🌐 Production Deployment

### Environment Variables

For production, use `.env.production` as a template and configure:

**Required:**
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong random secret (32+ characters)
- `OPENAI_API_KEY` - Your OpenAI API key
- `NODE_ENV=production`

**Optional:**
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed origins for CORS
- Email configuration for password reset
- AWS S3 for file uploads
- Analytics tracking

### Build for Production

```bash
# Install dependencies
pnpm install --prod

# Build the application
pnpm build

# Start production server
pnpm start
```

### Deployment Platforms

#### **Vercel / Netlify**
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy with one click

#### **VPS / Cloud Server**
1. Install Node.js 18+ and MySQL
2. Clone repository and install dependencies
3. Set up environment variables
4. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "sprintly" -- start
pm2 save
pm2 startup
```

#### **Railway / Render**
1. Connect GitHub repository
2. Add MySQL database addon
3. Set environment variables
4. Deploy automatically

---

## 🔧 Database Management

### Push Schema Changes

```bash
pnpm db:push
```

### Reset Database

```bash
# Drop all tables and recreate
pnpm db:push --force
```

### Seed Data

```bash
node scripts/seed-local.mjs
```

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS to allow only your domain
- [ ] Set up database backups
- [ ] Use strong database passwords
- [ ] Keep dependencies updated

---

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

### Logs

Development:
```bash
pnpm dev
```

Production with PM2:
```bash
pm2 logs sprintly
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `ER_ACCESS_DENIED_ERROR`
- Check `DATABASE_URL` credentials
- Ensure MySQL is running
- Verify database exists

**Error:** `ECONNREFUSED`
- Check MySQL is running: `systemctl status mysql`
- Verify host and port in `DATABASE_URL`

### Authentication Issues

**Error:** `Invalid token`
- Ensure `JWT_SECRET` is set
- Check cookie configuration

**Login redirects to login page**
- Clear browser cookies
- Check server logs for errors

### OpenAI API Issues

**Error:** `Invalid API key`
- Verify `OPENAI_API_KEY` is correct
- Check API key has credits

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/hrunx/Gasable_Hub/issues
- Documentation: See `LOCAL_DEPLOYMENT.md`

---

## 📝 License

MIT License - see LICENSE file for details
