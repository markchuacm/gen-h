#!/usr/bin/env bash
# One-time preparation of a fresh Ubuntu 24.04 Lightsail instance for the
# Verae stack. Run as the default ubuntu user: sudo bash setup-instance.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# --- 2 GiB swap (ClamAV's signature database is RAM-heavy) ---------------
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- Docker Engine + Compose plugin from Docker's repository -------------
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  usermod -aG docker ubuntu
fi

# --- Unattended security upgrades ----------------------------------------
apt-get install -y -q unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# --- SSH hardening: keys only, no root logins ----------------------------
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload ssh

timedatectl set-timezone UTC
install -d -o ubuntu -g ubuntu /opt/verae

echo "Instance ready. Deploy the repo to /opt/verae."
