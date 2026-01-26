# Installation Guide

Complete installation instructions for KubeChart in different environments.

## System Requirements

### Minimum Requirements

- **OS**: Linux, macOS, or Windows (WSL2)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 1GB free space
- **Node.js**: v18.0.0 or higher
- **npm/pnpm**: Latest version

### Recommended Setup

- **OS**: Linux (Ubuntu 20.04 LTS or newer)
- **RAM**: 8GB or more
- **Disk Space**: 10GB or more
- **Node.js**: v20 LTS
- **pnpm**: v8.0.0 or higher

## Platform-Specific Installation

### macOS

#### Using Homebrew

```bash
# Install Node.js
brew install node

# Install pnpm
brew install pnpm

# Verify installation
node --version
pnpm --version
```

#### Using nvm (Recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 20
nvm use 20

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Linux (Ubuntu/Debian)

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Add to PATH
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

### Windows

#### Using chocolatey

```powershell
# Install Node.js
choco install nodejs

# Install pnpm
npm install -g pnpm

# Verify
node --version
pnpm --version
```

#### Using Windows Subsystem for Linux (WSL2)

```bash
# Enable WSL2
wsl --install

# Inside WSL2 Ubuntu:
sudo apt-get update
sudo apt-get install nodejs npm

# Install pnpm
npm install -g pnpm
```

## Repository Setup

### Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-repo/kubechart.git
cd kubechart

# Using SSH
git clone git@github.com:your-repo/kubechart.git
cd kubechart
```

### Install Dependencies

```bash
# Clean install
pnpm install

# If you have existing node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verify installation
pnpm --version
```

## Database Setup

### Using PostgreSQL

#### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE kubechart;"

# Create user
psql -U postgres -c "CREATE USER kubechart WITH PASSWORD 'your_password';"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE kubechart TO kubechart;"
```

#### Docker PostgreSQL

```bash
docker run -d \
  --name kubechart-db \
  -e POSTGRES_USER=kubechart \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=kubechart \
  -p 5432:5432 \
  postgres:15
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Connection
DATABASE_URL=postgresql://kubechart:your_password@localhost:5432/kubechart

# Node Environment
NODE_ENV=development

# Server Port
PORT=8080

# Optional: API Keys, Secrets
API_SECRET=your_secret_key
```

## Kubernetes Setup (Optional)

### Install kubectl

```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Windows
choco install kubernetes-cli
```

### Configure kubectl

```bash
# Check configuration
kubectl config view

# Get cluster info
kubectl cluster-info

# Verify access
kubectl auth can-i create deployments
```

## Docker Installation (Optional)

### macOS

```bash
# Using Homebrew
brew install --cask docker

# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

### Linux

```bash
# Remove old Docker versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

### Windows

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

## Verification

After installation, verify everything is working:

```bash
# Check Node.js
node --version     # Should be v18+

# Check pnpm
pnpm --version     # Should be v8+

# Check database connection (if PostgreSQL is set up)
psql -U kubechart -d kubechart -c "SELECT 1;"

# Check kubectl (if Kubernetes is set up)
kubectl version

# Check Docker (if installed)
docker --version
```

## Running Tests

Verify the installation by running the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Next Steps

Once installation is complete:

1. **[Getting Started](GETTING_STARTED.md)** - Start your first application
2. **[Development Guide](DEVELOPMENT.md)** - Set up development environment
3. **[Deployment Guide](DEPLOYMENT.md)** - Learn deployment process

## Troubleshooting Installation

### Issue: pnpm command not found

```bash
# Reinstall pnpm
npm install -g pnpm

# Or if using npm
npm install -g pnpm@latest
```

### Issue: Node version mismatch

```bash
# Using nvm
nvm install 20
nvm alias default 20

# Verify
node --version
```

### Issue: Database connection failed

```bash
# Check if PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Verify credentials in .env
cat .env | grep DATABASE_URL
```

### Issue: Port already in use

```bash
# Find what's using the port
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3000 pnpm dev
```

## Getting Help

- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Getting Started](GETTING_STARTED.md)** - Quick start guide
- Create an issue on GitHub if you encounter problems

---

**Installation complete!** You're ready to start using KubeChart.
